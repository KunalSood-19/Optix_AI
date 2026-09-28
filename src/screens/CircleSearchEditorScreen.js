import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, PanResponder, TouchableOpacity, Text, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Polyline } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function CircleSearchEditorScreen({ route, navigation }) {
  const { imageUri, base64 } = route.params;
  const [points, setPoints] = useState([]);
  const pointsRef = useRef([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ 
    width: route.params?.imageWidth || 0, 
    height: route.params?.imageHeight || 0 
  });

  useEffect(() => {
    if (imageUri && (imageSize.width === 0 || imageSize.height === 0)) {
      Image.getSize(imageUri, (w, h) => {
        setImageSize({ width: w, height: h });
      }, (err) => console.log("Image getSize err:", err));
    }
  }, [imageUri]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setIsDrawing(true);
        const x = gestureState.x0 || evt.nativeEvent.pageX || 0;
        const y = gestureState.y0 || evt.nativeEvent.pageY || 0;
        pointsRef.current = [{ x, y }];
        setPoints([{ x, y }]);
      },
      onPanResponderMove: (evt, gestureState) => {
        const x = gestureState.moveX || evt.nativeEvent.pageX || 0;
        const y = gestureState.moveY || evt.nativeEvent.pageY || 0;
        pointsRef.current.push({ x, y });
        // Update state less frequently for better performance, or just spread
        setPoints([...pointsRef.current]);
      },
      onPanResponderRelease: async (evt, gestureState) => {
        setIsDrawing(false);
        // Delay slightly to let the UI update the final stroke
        setTimeout(async () => {
          if (pointsRef.current.length < 5) {
            pointsRef.current = [];
            setPoints([]);
            return;
          }
          await processCrop();
        }, 100);
      }
    })
  ).current;

  const processCrop = async () => {
    setIsProcessing(true);
    try {
      if (imageSize.width === 0 || imageSize.height === 0) {
        console.warn("Image size could not be loaded. Skipping crop fallback.");
        navigation.replace("Result", {
          imageUri: imageUri,
          base64: base64,
          extractedText: "",
          mode: "circleToSearch", 
        });
        return;
      }
      
      const screenRatio = width / height;
      const imageRatio = imageSize.width / imageSize.height;
      
      let renderedWidth, renderedHeight, offsetX = 0, offsetY = 0;
      
      if (imageRatio > screenRatio) {
        renderedWidth = width;
        renderedHeight = width / imageRatio;
        offsetY = (height - renderedHeight) / 2;
      } else {
        renderedHeight = height;
        renderedWidth = height * imageRatio;
        offsetX = (width - renderedWidth) / 2;
      }

      let minX = width;
      let maxX = 0;
      let minY = height;
      let maxY = 0;

      // Calculate bounds based on the drawn line
      pointsRef.current.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      // Expand bounding box slightly for context
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(width, maxX + padding);
      maxY = Math.min(height, maxY + padding);

      // Adjust for letterboxing/pillarboxing offset
      const adjustedMinX = Math.max(0, minX - offsetX);
      const adjustedMinY = Math.max(0, minY - offsetY);
      const adjustedMaxX = Math.min(renderedWidth, maxX - offsetX);
      const adjustedMaxY = Math.min(renderedHeight, maxY - offsetY);

      const boxWidth = adjustedMaxX - adjustedMinX;
      const boxHeight = adjustedMaxY - adjustedMinY;

      if (boxWidth <= 0 || boxHeight <= 0) {
        setIsProcessing(false);
        setPoints([]);
        return;
      }

      const scale = imageSize.width / renderedWidth;
      
      const cropX = Math.floor(Math.max(0, adjustedMinX * scale));
      const cropY = Math.floor(Math.max(0, adjustedMinY * scale));
      const cropW = Math.max(1, Math.floor(Math.min(imageSize.width - cropX, boxWidth * scale)));
      const cropH = Math.max(1, Math.floor(Math.min(imageSize.height - cropY, boxHeight * scale)));

      const cropAction = {
        crop: {
          originX: cropX,
          originY: cropY,
          width: cropW,
          height: cropH
        }
      };

      // Web blob URIs crash ImageManipulator, so we use raw base64 if available on Web.
      // On Android/iOS, passing massive base64 strings crashes the bridge, so we MUST use the native file URI.
      const sourceUri = Platform.OS === 'web' 
        ? ((base64 && !imageUri.startsWith('data:')) ? `data:image/jpeg;base64,${base64}` : imageUri)
        : imageUri;

      let cropped;
      try {
        cropped = await ImageManipulator.manipulateAsync(
          sourceUri,
          [cropAction],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
      } catch (cropError) {
        console.warn("Cropping failed (likely a Web limitation), falling back to full image:", cropError);
        cropped = { uri: imageUri, base64: base64 };
      }

      // Route directly to ResultScreen in circleToSearch mode
      navigation.replace("Result", {
        imageUri: cropped.uri,
        base64: cropped.base64,
        extractedText: "",
        mode: "circleToSearch", 
      });

    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      setPoints([]);
    }
  };

  const polylineString = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={[StyleSheet.absoluteFill, styles.image]} resizeMode="contain" />
      
      {/* Drawing Canvas */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} {...panResponder.panHandlers}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          {/* Animated Glow Effect */}
          {points.length > 0 && (
            <>
              <Polyline points={polylineString} fill="none" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.2" />
              <Polyline points={polylineString} fill="none" stroke="#8AB4F8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />
              <Polyline points={polylineString} fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
            </>
          )}
          {/* Core White Line */}
          <Polyline points={polylineString} fill="none" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <BlurView intensity={30} tint="dark" style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
             <Ionicons name="close" size={28} color="#FFF" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Circle to Search</Text>
           <View style={{width: 28}} />
        </BlurView>
        
        {!isDrawing && points.length === 0 && (
          <View style={styles.instructionBanner} pointerEvents="none">
             <Text style={styles.instructionText}>Circle or highlight any object</Text>
          </View>
        )}
      </SafeAreaView>

      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, marginHorizontal: 16, marginTop: 10, borderRadius: 24 },
  headerTitle: { color: '#FFF', fontSize: 16, fontFamily: 'Rajdhani_700Bold', textTransform: 'uppercase' },
  backBtn: { padding: 4 },
  instructionBanner: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  instructionText: { color: '#FFF', fontFamily: 'Rajdhani_600SemiBold', fontSize: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFF', marginTop: 12, fontFamily: 'Rajdhani_600SemiBold', fontSize: 16 }
});
