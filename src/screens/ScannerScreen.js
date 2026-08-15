import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {  View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Pressable, ActivityIndicator, FlatList, Animated, Easing, Dimensions  } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { extractTextFromImage } from "../services/ocrService";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const SCANNER_MODES = [
  { id: "document", label: "Document", icon: "scan-outline", color: "#E91E63" },
  { id: "ocr", label: "Text / OCR", icon: "text-outline", color: "#E91E8C" },
  { id: "objectDetection", label: "Object", icon: "cube-outline", color: "#9C27B0" },
  { id: "math", label: "Math", icon: "calculator-outline", color: "#2196F3" },
  { id: "handwriting", label: "Handwriting", icon: "pencil-outline", color: "#4CAF50" },
  { id: "study", label: "Study Mode", icon: "school-outline", color: "#3F51B5" },
  { id: "notes", label: "Notes", icon: "document-text-outline", color: "#009688" },
  { id: "receipt", label: "Receipt", icon: "receipt-outline", color: "#FF9800" },
  { id: "businessCard", label: "Business", icon: "card-outline", color: "#2196F3" },
  { id: "summary", label: "Summarizer", icon: "sparkles-outline", color: "#D97757" },
  { id: "qr", label: "QR Code", icon: "qr-code-outline", color: "#607D8B" },
];

export default function ScannerScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  
  const [mode, setMode] = useState(route?.params?.mode || "document");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [capturedPages, setCapturedPages] = useState([]);
  const cameraRef = useRef(null);
  const flatListRef = useRef(null);

  const ITEM_WIDTH = 110;
  const { width: screenWidth } = Dimensions.get('window');
  const PADDING_HORIZONTAL = (screenWidth - ITEM_WIDTH) / 2;

  const handleScrollEnd = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / ITEM_WIDTH);
    if (SCANNER_MODES[index]) {
      setMode(SCANNER_MODES[index].id);
    }
  };

  const handleModeSelect = (item, index) => {
    setMode(item.id);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: index * ITEM_WIDTH,
        animated: true,
      });
    }
  };

  const laserAnim = useRef(new Animated.Value(0)).current;
  const bracketAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 240,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bracketAnim, {
          toValue: 1.03,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bracketAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (route?.params?.mode) {
      setMode(route.params.mode);
      const index = SCANNER_MODES.findIndex(m => m.id === route.params.mode);
      if (index !== -1 && flatListRef.current) {
        setTimeout(() => {
           flatListRef.current?.scrollToOffset({ offset: index * ITEM_WIDTH, animated: true });
        }, 300);
      }
    }
  }, [route?.params?.mode]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#D97757" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>We need your permission to show the camera.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeModeItem = SCANNER_MODES.find(m => m.id === mode) || SCANNER_MODES[0];

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }
  
  function toggleFlash() {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }

  async function processImagePayload(imageUri, rawBase64) {
    setIsProcessing(true);
    try {
      if (mode === "qr") {
        setIsProcessing(false);
        navigation.navigate("QRScanner", { mode });
        return;
      }

      const isOcrMode = mode !== "objectDetection";
      const compressQuality = 0.8;
      
      const compressed = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        {
          compress: compressQuality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true
        }
      );

      let extractedText = "";
      if (isOcrMode && mode !== "handwriting" && mode !== "math") {
        extractedText = await extractTextFromImage(compressed.uri, compressed.base64);
      }

      const base64Data = compressed.base64 || rawBase64;

      if (mode === "handwriting") {
        setCapturedPages(prev => [...prev, base64Data]);
        setIsProcessing(false);
        return; 
      }

      if (mode === "math") {
        navigation.navigate("Study", {
          screen: "MathSolver",
          params: {
            imageUri: compressed.uri,
            base64: base64Data
          }
        });
        setIsProcessing(false);
        return;
      }

      if (mode === "study") {
        navigation.navigate("Study", {
          screen: "StudyDashboard",
          params: {
            imageUri: compressed.uri,
            base64: base64Data,
            extractedText,
          }
        });
      } else {
        navigation.navigate("Result", {
          imageUri: compressed.uri,
          base64: base64Data,
          extractedText,
          mode,
        });
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Processing Error", "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function takePicture() {
    if (mode === "qr") {
      navigation.navigate("QRScanner", { mode });
      return;
    }
    
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        await processImagePayload(photo.uri, photo.base64);
      } catch (err) {
        Alert.alert("Camera Error", "Failed to capture image.");
      }
    }
  }

  async function pickFromGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        if (mode === "qr") {
          setIsProcessing(true);
          try {
            const formData = new FormData();
            formData.append('file', {
              uri: result.assets[0].uri,
              name: 'qr_image.jpg',
              type: 'image/jpeg',
            });
            
            const response = await fetch('http://api.qrserver.com/v1/read-qr-code/', {
              method: 'POST',
              body: formData,
              headers: {
                'Accept': 'application/json',
              },
            });
            
            const data = await response.json();
            const scannedData = data?.[0]?.symbol?.[0]?.data;
            
            setIsProcessing(false);
            if (scannedData) {
              navigation.navigate("QRScanner", { mode: "qr", scannedData: scannedData });
            } else {
              Alert.alert("QR Code Not Found", "Could not detect any QR code in this image.");
            }
          } catch(e) {
            setIsProcessing(false);
            Alert.alert("Scan Error", "Failed to scan image for QR codes.");
          }
        } else {
          await processImagePayload(result.assets[0].uri, result.assets[0].base64);
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Gallery Error", "Unable to select image.");
    }
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        enableTorch={flash === 'on'}
        ref={cameraRef}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Top Controls - Glassmorphism */}
          <BlurView intensity={30} tint="dark" style={styles.topControls}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate("HomeDashboard")}>
              <Ionicons name="home" size={24} color="#FFF" style={styles.iconShadow} />
            </TouchableOpacity>
            
            <View style={styles.modeBadge}>
               <Ionicons name={activeModeItem.icon} size={14} color="#FFCC00" />
               <Text style={styles.modeBadgeText}>{activeModeItem.label}</Text>
            </View>

            <TouchableOpacity style={styles.iconBtn} onPress={toggleFlash}>
              <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={24} color={flash === 'on' ? "#FFCC00" : "#FFF"} style={styles.iconShadow} />
            </TouchableOpacity>
          </BlurView>

          {/* Center Brackets */}
          <View style={styles.centerArea}>
            <Animated.View style={[styles.bracketContainer, { transform: [{ scale: bracketAnim }] }]}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Animated Laser Line */}
              <Animated.View style={[styles.laserLine, { transform: [{ translateY: laserAnim }] }]}>
                <LinearGradient
                  colors={['rgba(255, 204, 0, 0)', 'rgba(255, 204, 0, 0.9)', 'rgba(255, 204, 0, 0)']}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </Animated.View>
            
            {isProcessing && (
              <BlurView intensity={50} tint="dark" style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFCC00" />
                <Text style={styles.loadingText}>Processing...</Text>
              </BlurView>
            )}
          </View>

          {/* Handwriting Multi-page support */}
          {capturedPages.length > 0 && mode === "handwriting" && (
            <BlurView intensity={40} tint="dark" style={styles.handwritingBanner}>
              <Text style={styles.handwritingBannerText}>{capturedPages.length} pages captured</Text>
              <TouchableOpacity 
                style={styles.processMultiBtn}
                onPress={() => {
                  navigation.navigate("Study", {
                    screen: "HandwritingEditor",
                    params: { base64Array: capturedPages }
                  });
                  setCapturedPages([]);
                }}
              >
                <Text style={styles.processMultiText}>Finish</Text>
                <Ionicons name="arrow-forward" size={16} color="#1A1A2E" />
              </TouchableOpacity>
            </BlurView>
          )}

          {/* Bottom Controls with BlurView Dock */}
          <View style={styles.bottomArea}>
            {/* Mode Selector Carousel */}
            <View style={styles.carouselContainer}>
              <FlatList 
                ref={flatListRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, alignItems: 'center' }}
                snapToInterval={ITEM_WIDTH}
                decelerationRate="fast"
                data={SCANNER_MODES}
                keyExtractor={item => item.id}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={handleScrollEnd}
                getItemLayout={(data, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
                initialScrollIndex={Math.max(0, SCANNER_MODES.findIndex(m => m.id === mode))}
                renderItem={({ item, index }) => {
                  const isSelected = item.id === mode;
                  return (
                    <TouchableOpacity
                      style={[styles.carouselItem, { width: ITEM_WIDTH }]}
                      onPress={() => handleModeSelect(item, index)}
                    >
                      <Text 
                        style={[
                          styles.carouselLabel, 
                          isSelected && { color: "#FFCC00", fontWeight: "bold", fontSize: 14 }
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {isSelected && <View style={styles.activeDot} />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            
            <BlurView intensity={50} tint="dark" style={styles.bottomControls}>
              <View style={styles.bottomLeftActions}>
                <TouchableOpacity style={styles.bottomIconBtn} onPress={pickFromGallery}>
                  <View style={styles.galleryPreviewMock}>
                    <Ionicons name="images" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.captureBtnWrapper}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.captureBtnOuter,
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                  onPress={takePicture}
                  disabled={isProcessing}
                >
                  <View style={styles.captureBtnInner}>
                     <Ionicons name={activeModeItem.icon} size={28} color="#1A1A2E" />
                  </View>
                </Pressable>
              </View>

              <TouchableOpacity style={styles.bottomIconBtn} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={26} color="#FFF" style={styles.iconShadow} />
              </TouchableOpacity>
            </BlurView>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#060B1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: '#9AA4BF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionBtn: {
    backgroundColor: '#D97757',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    padding: 15,
  },
  cancelBtnText: {
    color: '#9AA4BF',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  modeBadgeText: {
    color: '#FFCC00',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bracketContainer: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(255, 204, 0, 0.9)',
    borderRadius: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    top: 0,
    shadowColor: '#FFCC00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  carouselContainer: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 6,
  },
  carouselItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  carouselLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFCC00',
    marginTop: 4,
  },
  loadingContainer: {
    position: 'absolute',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  loadingText: {
    color: '#FFCC00',
    marginTop: 12,
    fontWeight: 'bold',
    fontSize: 16,
  },
  handwritingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  handwritingBannerText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  processMultiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFCC00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  processMultiText: {
    color: '#1A1A2E',
    fontWeight: 'bold',
  },
  bottomArea: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 40,
    overflow: 'hidden',
  },
  bottomLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomIconBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryPreviewMock: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  captureBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureBtnInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFCC00',
    justifyContent: 'center',
    alignItems: 'center',
  }
});