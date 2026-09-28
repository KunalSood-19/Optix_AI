const fs = require('fs');
let code = fs.readFileSync('src/screens/ScannerScreen.js', 'utf8');

code = code.replace(
`  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    backgroundColor: 'rgba(25,25,25,0.7)',
    padding: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },`,
`  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    backgroundColor: 'rgba(25,25,25,0.7)',
    padding: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 350,
  },`
);

fs.writeFileSync('src/screens/ScannerScreen.js', code);
console.log('Grid layout updated to 3x4.');
