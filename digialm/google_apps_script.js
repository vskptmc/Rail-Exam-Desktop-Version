function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("UserLogs");
    if (!sheet) {
      // If the sheet doesn't exist, create it and set headers.
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("UserLogs");
      newSheet.appendRow(["Timestamp", "USER", "EVENT", "DESCRIPTION"]);
    }

    // Parse the JSON data from the request body
    const data = JSON.parse(e.postData.contents);
    
  const timestamp = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    const user = data.user || 'GUEST';
    const event = data.event || '';
    const description = data.description || '';

    // Append the new log entry as a new row with four columns
    sheet.appendRow([timestamp, user, event, description]);

    // Return a success response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Log received"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return an error response if something goes wrong
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}