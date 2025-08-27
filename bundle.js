const fs = require('fs');
const path = require('path');

function bundleContentScript() {
  const distDir = './dist';
  
  // Read all the compiled files
  const types = fs.readFileSync(path.join(distDir, 'types/index.js'), 'utf8');
  const settingsManager = fs.readFileSync(path.join(distDir, 'utils/settings-manager.js'), 'utf8');
  const stringProcessor = fs.readFileSync(path.join(distDir, 'utils/string-processor.js'), 'utf8');
  const content = fs.readFileSync(path.join(distDir, 'content.js'), 'utf8');

  // Create a bundled version
  const bundled = `
// Types module
(function() {
${types.replace(/"use strict";\s*Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/, '')
      .replace(/exports\./g, 'window.IJSR_TYPES = window.IJSR_TYPES || {}; window.IJSR_TYPES.')}
})();

// Settings Manager module
(function() {
${settingsManager.replace(/"use strict";\s*Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/, '')
               .replace(/const types_1 = require\("\.\.\/types"\);/, '')
               .replace(/types_1\./g, 'window.IJSR_TYPES.')
               .replace(/exports\./g, 'window.IJSR_SETTINGS = window.IJSR_SETTINGS || {}; window.IJSR_SETTINGS.')
               .replace(/exports\[\"([^"]+)\"\]/g, 'window.IJSR_SETTINGS.$1')}
})();

// String Processor module
(function() {
${stringProcessor.replace(/"use strict";\s*Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/, '')
                .replace(/const types_1 = require\("\.\.\/types"\);/, '')
                .replace(/types_1\./g, 'window.IJSR_TYPES.')
                .replace(/exports\./g, 'window.IJSR_STRING_PROCESSOR = window.IJSR_STRING_PROCESSOR || {}; window.IJSR_STRING_PROCESSOR.')}
})();

// Content Script
(function() {
${content.replace(/"use strict";\s*Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/, '')
         .replace(/const types_1 = require\("\.\/types"\);/, '')
         .replace(/const string_processor_1 = require\("\.\/utils\/string-processor"\);/, '')
         .replace(/const settings_manager_1 = require\("\.\/utils\/settings-manager"\);/, '')
         .replace(/types_1\./g, 'window.IJSR_TYPES.')
         .replace(/string_processor_1\./g, 'window.IJSR_STRING_PROCESSOR.')
         .replace(/settings_manager_1\./g, 'window.IJSR_SETTINGS.')}
})();
`;

  fs.writeFileSync(path.join(distDir, 'content-bundled.js'), bundled);
  console.log('Content script bundled successfully');
}

function bundlePopupScript() {
  const distDir = './dist';
  
  const types = fs.readFileSync(path.join(distDir, 'types/index.js'), 'utf8');
  const popup = fs.readFileSync(path.join(distDir, 'popup.js'), 'utf8');

  const bundled = `
// Types module
(function() {
${types.replace(/"use strict";\s*Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/, '')
      .replace(/exports\./g, 'window.IJSR_TYPES = window.IJSR_TYPES || {}; window.IJSR_TYPES.')}
})();

// Popup Script
(function() {
${popup.replace(/"use strict";\s*Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/, '')
       .replace(/const types_1 = require\("\.\/types"\);/, '')
       .replace(/types_1\./g, 'window.IJSR_TYPES.')}
})();
`;

  fs.writeFileSync(path.join(distDir, 'popup-bundled.js'), bundled);
  console.log('Popup script bundled successfully');
}

bundleContentScript();
bundlePopupScript();