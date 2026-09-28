const fs = require('fs');

let content = fs.readFileSync('src/screens/ScannerScreen.js', 'utf8');

// 1. Add isGridOpen state
content = content.replace(
  'const [isProcessing, setIsProcessing] = useState(false);',
  'const [isProcessing, setIsProcessing] = useState(false);\n  const [isGridOpen, setIsGridOpen] = useState(false);'
);

// 2. Remove FlatList related things
content = content.replace(/const ITEM_WIDTH = 110;[\s\S]*?const laserAnim = useRef/m, 
`const handleModeSelect = (item) => {
    setMode(item.id);
    setIsGridOpen(false);
  };

  const laserAnim = useRef`);

content = content.replace(/useEffect\(\(\) => \{\n    if \(route\?\.params\?\.mode\) \{[\s\S]*?\}, \[route\?\.params\?\.mode\]\);/m, 
`useEffect(() => {
    if (route?.params?.mode) {
      setMode(route.params.mode);
    }
  }, [route?.params?.mode]);`);

// 3. Remove FlatList from render and add longPress
content = content.replace(/\{.*?Mode Selector Carousel.*?\}[\s\S]*?<BlurView intensity=\{50\} tint="dark" style=\{styles\.bottomControls\}>/m, 
`<BlurView intensity={50} tint="dark" style={styles.bottomControls}>`);

content = content.replace(
  'onPress={takePicture}\n                  disabled={isProcessing}',
  'onPress={takePicture}\n                  onLongPress={() => setIsGridOpen(true)}\n                  disabled={isProcessing}'
);

// 4. Add Modal
const modalCode = `
      <Modal visible={isGridOpen} transparent animationType="fade">
        <BlurView intensity={70} tint="dark" style={styles.modalBlur}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={() => setIsGridOpen(false)}
          >
            <View style={styles.gridContainer}>
              {SCANNER_MODES.map((item) => {
                const isSelected = item.id === mode;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                    onPress={() => handleModeSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.gridIconWrapper, isSelected && { backgroundColor: item.color + '40' }]}>
                       <Ionicons name={item.icon} size={28} color={isSelected ? item.color : "#F4F4F4"} />
                    </View>
                    <Text style={[styles.gridItemText, isSelected && { color: item.color }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.gridHintText}>Tap anywhere to close</Text>
          </TouchableOpacity>
        </BlurView>
      </Modal>
    </View>
  );
}`;

content = content.replace(/<\/CameraView>\n    <\/View>\n  \);\n\}/, `</CameraView>\n${modalCode}`);

// 5. Add styles
const newStyles = `
  modalBlur: {
    flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    backgroundColor: 'rgba(25,25,25,0.7)',
    padding: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gridItem: {
    width: 90,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gridIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridItemText: {
    color: '#A3A3A3',
    fontSize: 12,
    fontFamily: 'Rajdhani_600SemiBold',
    textAlign: 'center',
  },
  gridHintText: {
    color: '#A3A3A3',
    fontSize: 14,
    fontFamily: 'Rajdhani_500Medium',
    marginTop: 30,
  },
`;

content = content.replace('bottomArea: {', newStyles + '\n  bottomArea: {');

fs.writeFileSync('src/screens/ScannerScreen.js', content);
console.log('Scanner UI updated to grid modal!');
