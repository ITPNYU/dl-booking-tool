const VIMEO_CLIENT_ID = "";
const VIMEO_CLIENT_SECRET =
  "";
const VIMEO_ACCESS_TOKEN = "";
const VIMEO_FOLDER_ID = "15602092";
const VIMEO_USER_ID = "3661860";

//production
const api_key = "";
const api_token =
  "";
const board_id = "621296e17f5ddb50fa62a17f";
const sheetId = "1mwNXfiR9Q6sbacysqP8hBSucznA_qypomcVqffPrtyw";
const labelId = "Promo";


function getTrelloCards() {
  var url =
    "https://api.trello.com/1/search?key=" +
    api_key +
    "&token=" +
    api_token +
    "&idBoards=" +
    board_id +
    "&query=label:" +
    labelId +
    "&card_fields=name,idList,labels&cards_limit=1000";
  var response = UrlFetchApp.fetch(url);
  var result = JSON.parse(response.getContentText());
  var cardsWithLabel = result.cards;
  return cardsWithLabel;
}
function getVideoIdCaptionId(card) {
  var videoId = "";
  var captionId = "";
  Logger.log("Name: " + card.name + " | Card ID: " + card.id);
  const userFolder = DriveApp.getFoldersByName(card.name);
  console.log(userFolder.hasNext(), "user folder");
  while (userFolder.hasNext()) {
    var folder = userFolder.next();
    const finalFolders = folder.getFoldersByName("_finals");
    while (finalFolders.hasNext()) {
      var finalFolder = finalFolders.next();
      // Get documantation videoId
      const files = finalFolder.searchFiles(
        "title contains '_gfx.mp4'");
      console.log(files.hasNext(), "files");
      while (files.hasNext()) {
        var file = files.next();
        videoId = file.getId();
      }
      // Get caption id
      const captionFiles = finalFolder.searchFiles('title contains ".srt"');
      while (captionFiles.hasNext()) {
        var file = captionFiles.next();
        captionId = file.getId();
      }
    }
  }
  return { videoId: videoId, captionId: captionId };
}

function myFunction() {
  //Get
  const targetCards = getTrelloCards();

  const sortedCards = targetCards.sort(function (a, b) {
    if (a.name > b.name) {
      return 1;
    } else {
      return -1;
    }
  });
  sortedCards.forEach((card) => {
    const { videoId, captionId } = getVideoIdCaptionId(card);

    // Get form information from spreadSheet
    const netId = card.name.match("_(.+?)_")[1];
    const projectOneWord = card.name.match(".+_(.+?)$")[1];
    var sheet = SpreadsheetApp.openById(sheetId);

    //production
    const netIdHeader = "C";
    const titleHeader = "U";
    const oneWordtitleHeader = "V";
    const descriptionHeader = "W";
    const semesterHeader = "T";
    const firstNameHeader = "I";
    const lastNameHeader = "J";
    const firstNameHeader1 = "Z";
    const lastNameHeader1 = "AA";
    const firstNameHeader2 = "AM";
    const lastNameHeader2 = "AN";
    const firstNameHeader3 = "AX";
    const lastNameHeader3 = "AY";
    const vimeoHeader = "CX";

    //test
    // const netIdHeader = "F"
    // const titleHeader = "P"
    // const oneWordtitleHeader = "Q"
    // const descriptionHeader = "R"
    // const semesterHeader = "O"
    // const firstNameHeader = "C"
    // const lastNameHeader = "D"
    // const firstNameHeader1 = "Z"
    // const lastNameHeader1 = "AA"
    // const firstNameHeader2 = "AL"
    // const lastNameHeader2 = "AM"
    // const firstNameHeader3 = "AX"
    // const lastNameHeader3 = "AY"
    // const vimeoHeader = "CX"

    const lastRow = sheet.getLastRow();
    //console.log(`${netIdHeader}1:${netIdHeader}${lastRow}`,"lastRow")
    //指定したセル範囲を取得する
    const range = sheet.getRange(`${netIdHeader}1:${netIdHeader}${lastRow}`);
    const textFinder = range.createTextFinder(netId);

    // すべての検索結果を取得する
    const ranges = textFinder.findAll();
    console.log(ranges.length, "net id rows");
    let targetInfo;

    const finders = ranges
      .map((range) => {
        const row = range.getRow();

        //Some people don't have one word titles, so when user only have one line, use that.
        if (ranges.length > 1) {
          return sheet
            .getRange(`A${row}:DA${row}`)
            .createTextFinder(projectOneWord)
            .findNext();
        } else {
          return range;
        }
      })
      .filter((e) => e);
    if (finders.length === 0) {
      console.log("!!!!!!!!!!! No intake form!!!!!!!!!!!!!!!!!");
    } else {
      const finder = finders[0];
      const rowNumber = finder.getRow();
      const title = sheet.getRange(`${titleHeader}${rowNumber}`).getValue();
      const oneWordtitle = sheet
        .getRange(`${oneWordtitleHeader}${rowNumber}`)
        .getValue();
      const semester = sheet
        .getRange(`${semesterHeader}${rowNumber}`)
        .getValue();
      const description = sheet
        .getRange(`${descriptionHeader}${rowNumber}`)
        .getValue();
      const firstName = sheet
        .getRange(`${firstNameHeader}${rowNumber}`)
        .getValue();
      const lastName = sheet
        .getRange(`${lastNameHeader}${rowNumber}`)
        .getValue();
      const firstName1 = sheet
        .getRange(`${firstNameHeader1}${rowNumber}`)
        .getValue();
      const lastName1 = sheet
        .getRange(`${lastNameHeader1}${rowNumber}`)
        .getValue();
      const firstName2 = sheet
        .getRange(`${firstNameHeader2}${rowNumber}`)
        .getValue();
      const lastName2 = sheet
        .getRange(`${lastNameHeader2}${rowNumber}`)
        .getValue();
      const firstName3 = sheet
        .getRange(`${firstNameHeader3}${rowNumber}`)
        .getValue();
      const lastName3 = sheet
        .getRange(`${lastNameHeader3}${rowNumber}`)
        .getValue();
      const vimeoUrl = sheet.getRange(`${vimeoHeader}${rowNumber}`).getValue();

      targetInfo = {
        rowNumber: rowNumber,
        title: title,
        oneWordtitle: oneWordtitle,
        semester: semester,
        description: description,
        vimeoUrl: vimeoUrl,
        firstName: firstName,
        lastName: lastName,
        firstName1: firstName1,
        lastName1: lastName1,
        firstName2: firstName2,
        lastName2: lastName2,
        firstName3: firstName3,
        lastName3: lastName3,
      };
    }

    console.log(targetInfo);
    // Get video and caption from Google drive
    const sourceId = videoId;
    const textSourceId = captionId;
    console.log(sourceId, "sourceId");
    console.log(textSourceId, "textSourceId");
    if (videoId === "" || captionId === "") {
      console.log("!!!!!!!!!!!!!!!! I can't find video!!!!!!!!!!!!!!!!!!!!!!");
    } else if (targetInfo === null || targetInfo === undefined){
      console.log("!!!!!!!!!!!!!!!! I can't find doc information!!!!!!!!!!!!!!!!!!!!!!");
    }else if (targetInfo.vimeoUrl) {
      console.log("already uploaded");
    } else {
      // Change permission for update
      const videoSource = DriveApp.getFileById(sourceId);
      videoSource.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

      const sourceUrl = `https://drive.google.com/uc?id=${sourceId}&export=download&confirm=t`;
      console.log(sourceUrl);
      const names = `${targetInfo.firstName} ${targetInfo.lastName}${
        targetInfo.firstName1 !== ""
          ? ", " + targetInfo.firstName1 + " " + targetInfo.lastName1
          : ""
      }${
        targetInfo.firstName2 !== ""
          ? ", " + targetInfo.firstName2 + " " + targetInfo.lastName2
          : ""
      }${
        targetInfo.firstName3 !== ""
          ? ", " + targetInfo.firstName3 + " " + targetInfo.lastName3
          : ""
      }`;
      const videoName = `${targetInfo.title}(${names})`;
      const videoDescription = `${targetInfo.description} (${targetInfo.semester})`;

      const textSource = DriveApp.getFileById(textSourceId);
      const captions = textSource.getBlob().getDataAsString();

      console.log(videoName)
      console.log(videoDescription)
      
      // var getVideoOptions = {
      //   headers: { Authorization: "Bearer " + VIMEO_ACCESS_TOKEN },
      //   Accept: "application/vnd.vimeo.*+json;version=3.4",
      // };

      // //Upload captions to vimeo
      // const getVideoRes = UrlFetchApp.fetch(
      //   `https://api.vimeo.com/me/projects/${VIMEO_FOLDER_ID}`,
      //   getVideoOptions
      // );
      // console.log(getVideoRes.getContentText())

      //console.log(folderUri)
      // Upload video to vimeo
      var data = {
        upload: {
          approach: "pull",
          link: sourceUrl,
        },
        name: videoName,
        description: videoDescription,
        privacy: { view: "nobody" }
      };
      var options = {
        method: "post",
        headers: { Authorization: "Bearer " + VIMEO_ACCESS_TOKEN },
        Accept: "application/vnd.vimeo.*+json;version=3.4",
        contentType: "application/json",
        // Convert the JavaScript object to a JSON string.
        payload: JSON.stringify(data),
      };

      const uploadedRes = UrlFetchApp.fetch(
        `https://api.vimeo.com/users/${VIMEO_USER_ID}/videos`,
        options
      );
      const videoPath = JSON.parse(uploadedRes.getContentText())["uri"];
      //const videoPath = "/videos/811116170";
      const videoId = videoPath.match("videos/(.+)")[1];
      console.log(videoId, "videoId");
      var getVideoOptions = {
        headers: { Authorization: "Bearer " + VIMEO_ACCESS_TOKEN },
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      };

      //Upload captions to vimeo
      const getVideoRes = UrlFetchApp.fetch(
        `https://api.vimeo.com/${videoPath}`,
        getVideoOptions
      );
      console.log(JSON.parse(getVideoRes.getContentText()));
      const textTrackUri = JSON.parse(getVideoRes.getContentText())["metadata"][
        "connections"
      ]["texttracks"]["uri"];

      const textTrackPayload = {
        type: "captions",
        language: "en",
        name: "",
      };
      var textTrackoptions = {
        method: "post",
        headers: { Authorization: "Bearer " + VIMEO_ACCESS_TOKEN },
        Accept: "application/vnd.vimeo.*+json;version=3.4",
        "Content-Type": "application/json",
        payload: textTrackPayload,
      };

      const textTrackRes = UrlFetchApp.fetch(
        `https://api.vimeo.com/${textTrackUri}`,
        textTrackoptions
      );
      const textUploadLink = JSON.parse(textTrackRes.getContentText())["link"];
      var textUploadOptions = {
        method: "put",
        headers: {
          Authorization: "Bearer " + VIMEO_ACCESS_TOKEN,
          "Content-Type": "text/plain",
        },
        Accept: "application/vnd.vimeo.*+json;version=3.4",
        "Content-Type": "text/plain",
        payload: captions,
      };
      const textUploadRes = UrlFetchApp.fetch(
        textUploadLink,
        textUploadOptions
      );
      console.log(textUploadRes.getContentText());

      //set folder
      var setFolderOptions = {
        method: "put",
        headers: {
          Authorization: "Bearer " + VIMEO_ACCESS_TOKEN,
          "Content-Type": "text/plain",
        },
        Accept: "application/vnd.vimeo.*+json;version=3.4",
        "Content-Type": "text/plain",
      };
      const setFolderRes = UrlFetchApp.fetch(
        `https://api.vimeo.com/users/${VIMEO_USER_ID}/projects/${VIMEO_FOLDER_ID}/videos/${videoId}`,
        setFolderOptions
      );
      console.log(setFolderRes.getContentText());

      sheet
        .getRange(`${vimeoHeader}${targetInfo.rowNumber}`)
        .setValue(`https://vimeo.com${videoPath}`);
      Utilities.sleep(10000); // pause in the loop for 2000 milliseconds
      // remove permission
      videoSource.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE);

      //Send email to noah
      const email = "nopivnick@nyu.edu"
      GmailApp.sendEmail(email, `Uploaded video to vimeo: ${videoName}`, uploadedVideoMessage);

    }
  });
}
const uploadedVideoMessage = `
Hello, Noah.

The video has been uploaded to Vimeo. Please check it.
https://vimeo.com/manage/folders/15602092

- Doc Lab
`

