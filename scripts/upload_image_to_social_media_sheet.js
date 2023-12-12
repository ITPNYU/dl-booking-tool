//production
const api_key = "";
const api_token =
  "";
const board_id = "621296e17f5ddb50fa62a17f";
const labelId = "Promo";
const intakeSheetId = "";
const socialMediaSheetId = "";

//const api_key = "";
// const api_token = "";
// const callbackUrl = "";
// const labelId = "Promo";
// const board_id = "64050c5b8d19d8b65a097c00";
// const intakeSheetId = "";
// const socialMediaSheetId = "";


function getTrelloCards() {
    var url = "https://api.trello.com/1/search?key=" + api_key + "&token=" + api_token + "&idBoards=" + board_id + "&query=label:" + labelId + "&card_fields=name,idList,labels&cards_limit=1000";
    var response = UrlFetchApp.fetch(url);
    var result = JSON.parse(response.getContentText());
    return result.cards;
}

function getImageId(card) {
    var imageId = "";
    Logger.log("Name: " + card.name + " | Card ID: " + card.id);
    const userFolder = DriveApp.getFoldersByName(card.name);
    while (userFolder.hasNext()) {
        var folder = userFolder.next();
        const finalFolders = folder.getFoldersByName("_finals");
        while (finalFolders.hasNext()) {
            var finalFolder = finalFolders.next();
            const files = finalFolder.searchFiles('title contains "_hero.jpg"');
            while (files.hasNext()) {
                var file = files.next();
                imageId = file.getId();
            }
        }
    }
    return { imageId: imageId };
}

function isDataDuplicated(sheet, netIdHeader,netId, oneWordHeader,oneWord) {
    const netIdRange = sheet.getRange(`${netIdHeader}1:${netIdHeader}` + sheet.getLastRow());
    const oneWordRange = sheet.getRange(`${oneWordHeader}1:${oneWordHeader}` + sheet.getLastRow());

    const netIdMatches = netIdRange.createTextFinder(netId).findAll();
    for (let range of netIdMatches) {
        const rowIndex = range.getRow();
        console.log("rowIndex",rowIndex);
        console.log("oneWordRange.getCell(rowIndex, 1).getValue()",oneWordRange.getCell(rowIndex, 1).getValue());
        console.log("oneWord",oneWord);
        if (oneWordRange.getCell(rowIndex, 1).getValue().toLowerCase() === oneWord.toLowerCase()) {
            return true; 
        }
    }
    return false;
}


function setFilePublicAndFetchLink(fileId) {
  var file = DriveApp.getFileById(fileId);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = "https://drive.google.com/uc?export=view&id=" + fileId;
  return url;
}


function myFunction() {
    const targetCards = getTrelloCards().sort((a, b) => a.name.localeCompare(b.name));
    targetCards.forEach((card) => {
        const { imageId } = getImageId(card);
        console.log("imageId",imageId);

        if(imageId === "") {
          console.log("No image")
          return;
        }
 
        const netId = card.name.match('_(.+?)_')[1];
        const projectOneWord = card.name.match('.+_(.+?)$')[1];
        var sheet = SpreadsheetApp.openById(intakeSheetId);

        // Define headers for test environment
        const headers = {
            netIdHeader: "C",
            oneWordHeader: "V",
            socialMediaHeader: "F",
        };

        const socialMediaSheetheaders = {
            netIdHeader: "E",
            oneWordHeader: "X",
            socialMediaHeader: "H",
        };

        const lastRow = sheet.getLastRow();
        const range = sheet.getRange(`${headers.netIdHeader}1:${headers.netIdHeader}${lastRow}`);
        const textFinder = range.createTextFinder(netId);
        const ranges = textFinder.findAll();

        const finders = ranges.map((range) => {
            const row = range.getRow();
            if (ranges.length > 1) {
                return sheet.getRange(`A${row}:DA${row}`).createTextFinder(projectOneWord).findNext();
            } else {
                return range;
            }
        }).filter(e => e);

        if (finders.length === 0) {
            console.log("No intake form found!");
            return;
        } 
            const finder = finders[0];

            const rowNumber = finder.getRow();

        // Check if the value in F column is "Yes"
        const SocialMediaValue = sheet.getRange(`${headers.socialMediaHeader}${rowNumber}`).getValue();
        const projectOneWordValue = sheet.getRange(`${headers.oneWordHeader}${rowNumber}`).getValue();
        console.log("projectOneWordValue",projectOneWordValue);
        console.log("SocialMediaValue",SocialMediaValue);
        if (SocialMediaValue !== "Yes") {
            console.log(`Skipping card ${card.name}, because this work is not permitted for promotion,`);
            return;
        }
  
        const socialMediaSheet = SpreadsheetApp.openById(socialMediaSheetId);


        if (isDataDuplicated(socialMediaSheet, socialMediaSheetheaders.netIdHeader,netId, socialMediaSheetheaders.oneWordHeader,projectOneWordValue)) {
            console.log(`Data for ${netId} - ${projectOneWord} is already copied to the socialMediaSheet.`);
            return;
        }


        const imageDriveLink = "https://drive.google.com/uc?export=download&id=" + imageId;
        const link = setFilePublicAndFetchLink(imageId);
        const imageCellFormula = `=IMAGE("${link}")`;

        var targetLastRow = socialMediaSheet.getLastRow() + 1;
        
        socialMediaSheet.getSheets()[0].getRange(targetLastRow, 1).setValue(imageCellFormula);
        socialMediaSheet.getSheets()[0].getRange(targetLastRow, 2).setValue(imageDriveLink);
        var sourceData = sheet.getSheets()[0].getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues();
        
        
        socialMediaSheet.getSheets()[0].getRange(targetLastRow, 3, 1, sourceData[0].length).setValues(sourceData);
        socialMediaSheet.setRowHeight(targetLastRow, 100);
        console.log("Upload successful.")
    });
}

