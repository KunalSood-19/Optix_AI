const fs = require('fs');
let scannerJs = fs.readFileSync('src/screens/ScannerScreen.js', 'utf8');

scannerJs = scannerJs.replace(
  `    } catch (error) {
      console.log(error);
      Alert.alert("Processing Error", "Failed to process image. Please try again.");
    } finally {`,
  `    } catch (error) {
      console.log(error);
      Alert.alert("Processing Error", String(error.message || error));
    } finally {`
);

fs.writeFileSync('src/screens/ScannerScreen.js', scannerJs);
console.log("Updated error handling");
