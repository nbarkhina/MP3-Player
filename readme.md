# MP3 HTML Player
This is a fully web based MP3 Player. I worked on this project because I frankly couldn't find a good open source HTML5 player for my personal music. It supports the following features:

- Multiple Playlists
- Shuffle Songs
- Search for Songs
- Play in Background
- Play/pause from lock screen on mobile
- Prevent lockscreen on large devices
- Play ad-hoc songs
- Save settings to localstorage
- Fully responsive
- Music subdirectories

Put all of your MP3's into the media\ folder. Then fill out the audio.json with your list of songs. Or you can generate the audio.json automatically using the .NET Core script (see below) In order to compile the JavaScript files to do the following:

- `npm install -g typescript`
- `tsc`

# Scanner App (Optional)
You can  use the scanner program to generate an audio.json based on whatever songs are in the media directory. This will populate the filenames and MP3 Metadata. You can use it by doing the following:

- Make sure you have the .NET Core 5.0 SDK installed
- Then run `dotnet run` from the scannercore directory