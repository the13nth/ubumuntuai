// Store the current UI XML description
let currentUiXml = '';

// Function to update the UI XML
const updateUiXml = (newXml: string) => {
    console.log('XML Update:');
    console.log('Old XML:', currentUiXml);
    console.log('New XML:', newXml);
    console.log('Changes detected:', currentUiXml !== newXml);
    
    currentUiXml = newXml;
};

export { currentUiXml, updateUiXml }; 