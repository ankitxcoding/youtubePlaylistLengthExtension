const calculateButton = document.getElementById("calculateButton");
const playlistLink = document.getElementById("playlistLink");
const result = document.getElementById("result");

calculateButton.addEventListener("click", () => {
  const link = playlistLink.value;
  if (link.includes("youtube.com/playlist")) {
    const playlistId = link.match(/list=([^&]*)/)[1];
    const apiKey = "AIzaSyDZ7f1I6JSRPjyihhv1lOo_LKt4OrbfOLc";
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        let videoIds = data.items.map((item) => item.contentDetails.videoId);
        const nextPageToken = data.nextPageToken;
        const remainingVideos = data.pageInfo.totalResults - 50;
        let promises = [];

        for (let i = 0; i < Math.ceil(remainingVideos / 50); i++) {
          const pageUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`;
          promises.push(fetch(pageUrl));
        }

        Promise.all(promises)
          .then((responses) => Promise.all(responses.map((response) => response.json())))
          .then((data) => {
            for (let i = 0; i < data.length; i++) {
              const pageVideoIds = data[i].items.map((item) => item.contentDetails.videoId);
              videoIds = videoIds.concat(pageVideoIds);
            }

            const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(",")}&key=${apiKey}`;
            return fetch(videoDetailsUrl);
          })
          .then((response) => response.json())
          .then((data) => {
            const videoDurations = data.items.map((item) => item.contentDetails.duration);
            const totalSeconds = videoDurations.reduce((acc, duration) => acc + parseDuration(duration), 0);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            result.innerText = `Total length of the playlist: ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`;
          })
          .catch((error) => {
            console.error(error);
            result.innerText = "An error occurred while calculating the playlist length.";
          });
      })
      .catch((error) => {
        console.error(error);
        result.innerText = "An error occurred while calculating the playlist length.";
      });
  } else {
    result.innerText = "Please enter a valid YouTube playlist link.";
  }
});

function parseDuration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = regex.exec(duration);
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}