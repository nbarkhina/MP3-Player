var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MyApp {
        constructor() {
            this.currentFile = 0;
            this.firstTimePlay = true;
            this.audioFiles = [];
            this.audioFilesFiltered = [];
            this.isPaused = true;
            this.currentTab = Tabs.TabSongs;
            this.playlist = [];
            this.chkShuffle = false;
            this.chkIgnorePlaylist = false;
            this.shuffleSongsOrder = []; //internal shuffle order for songs
            this.shufflePlaylistOrder = []; //internal shuffle order for playlist
            this.txtSearch = '';
            this.currentPage = 0;
            this.pageSize = 5;
            this.disablePrev = false;
            this.disableNext = false;
            this.resultsLabel = '';
            this.songsLabel = '';
            this.addHocSong = 0;
            this.addHocSongPlaying = false;
            this.allPlaylists = [];
            this.bindRivets();
            this.loadAudioFiles();
            setTimeout(() => {
                $('#txtPlaylistName').bind("keypress", function (e) {
                    if (e.keyCode == 13) {
                        e.preventDefault();
                        window.myApp.btnSubmitNewPlaylist();
                        return false;
                    }
                });
                window.myApp.finishedLoading();
            }, 100);
        }
        finishedLoading() {
            $('#divLoading').hide();
            $('#divMain').show();
        }
        btnCreateNewPlaylist() {
            $('#createPlaylistModal').modal('show');
            setTimeout(function () {
                $('#txtPlaylistName').focus();
            }, 500);
        }
        btnSubmitNewPlaylist() {
            let name = $("#txtPlaylistName").val();
            let newPlaylist = new Playlist();
            newPlaylist.Name = name;
            newPlaylist.Playlist = JSON.parse(JSON.stringify(this.playlist));
            this.allPlaylists.push(newPlaylist);
            this.saveToLocalStorage();
            toastr.success('Playlist Created');
            $('#createPlaylistModal').modal('hide');
            setTimeout(function () {
                $("#txtPlaylistName").val('');
            }, 1000);
        }
        btnSavePlaylist() {
            let value = document.getElementById('ddlPlaylist').value;
            if (value != "Choose...") {
                let playlist = this.allPlaylists.find((p) => { return p.Name == value; });
                playlist.Playlist = JSON.parse(JSON.stringify(this.playlist));
                this.saveToLocalStorage();
                toastr.success('Playlist Saved');
            }
        }
        btnLoadPlaylist() {
            let value = document.getElementById('ddlPlaylist').value;
            if (value != "Choose...") {
                let oldPlaylist = this.allPlaylists.find((p) => { return p.Name == value; });
                this.playlist = [];
                oldPlaylist.Playlist.forEach(item => {
                    //repair ID
                    let masterAudioFile = this.audioFiles.find((i) => { return i.Filename == item.Filename; });
                    if (masterAudioFile)
                        this.playlist.push(masterAudioFile);
                });
                this.recalculatePlaylistIndices();
                this.saveToLocalStorage();
                toastr.success('Playlist Loaded');
            }
        }
        btnDeletePlaylist() {
            let value = document.getElementById('ddlPlaylist').value;
            if (value != "Choose...") {
                this.allPlaylists = this.allPlaylists.filter((p) => { return p.Name != value; });
                this.saveToLocalStorage();
                toastr.success('Playlist Deleted');
            }
        }
        prevPage() {
            this.currentPage--;
            this.runPagingAndFiltering();
        }
        nextPage() {
            this.currentPage++;
            this.runPagingAndFiltering();
        }
        runPagingAndFiltering() {
            //run search
            this.audioFilesFiltered = this.audioFiles.filter(file => {
                return file.Title.toLowerCase().indexOf(this.txtSearch.toLowerCase()) > -1 ||
                    file.Filename.toLowerCase().indexOf(this.txtSearch.toLowerCase()) > -1 ||
                    file.Album.toLowerCase().indexOf(this.txtSearch.toLowerCase()) > -1 ||
                    file.Artist.toLowerCase().indexOf(this.txtSearch.toLowerCase()) > -1;
            });
            //disable next/prev buttons        
            this.disablePrev = this.currentPage == 0;
            if ((this.currentPage + 1) * this.pageSize >= this.audioFilesFiltered.length)
                this.disableNext = true;
            else
                this.disableNext = false;
            this.resultsLabel = 'Page ' + (this.currentPage + 1) + ' of ' + Math.ceil(this.audioFilesFiltered.length / this.pageSize);
            this.songsLabel = '(' + this.audioFilesFiltered.length + ' Songs)';
            //calculate paging
            let pageStart = this.currentPage * this.pageSize;
            this.audioFilesFiltered = this.audioFilesFiltered.slice(pageStart, pageStart + this.pageSize);
        }
        txtSearchChanged(event) {
            this.txtSearch = event.target.value;
            this.runPagingAndFiltering();
        }
        loadFromLocalStorage() {
            //load playlist
            let itemToLoad = localStorage.getItem('MP3AudioPlaylist');
            if (itemToLoad) {
                let oldPlaylist = JSON.parse(itemToLoad);
                oldPlaylist.forEach(item => {
                    //repair ID
                    let masterAudioFile = this.audioFiles.find((i) => { return i.Filename == item.Filename; });
                    if (masterAudioFile)
                        this.playlist.push(masterAudioFile);
                });
            }
            //load all playlists
            itemToLoad = localStorage.getItem('MP3AudioAllPlaylists');
            if (itemToLoad) {
                let playlists = JSON.parse(itemToLoad);
                this.allPlaylists = [];
                playlists.forEach(playlist => {
                    let newPlaylist = new Playlist();
                    newPlaylist.Name = playlist.Name;
                    playlist.Playlist.forEach(item => {
                        //repair ID
                        let masterAudioFile = this.audioFiles.find((i) => { return i.Filename == item.Filename; });
                        if (masterAudioFile)
                            newPlaylist.Playlist.push(masterAudioFile);
                    });
                    this.allPlaylists.push(newPlaylist);
                });
            }
            //load shuffle setting
            let shuffle = localStorage.getItem('MP3AudioShuffle');
            if (shuffle && shuffle == 'yes') {
                this.chkShuffle = true;
            }
            //load ignore playlist setting
            let ignorePlaylist = localStorage.getItem('MP3AudioIgnorePlaylist');
            if (ignorePlaylist && ignorePlaylist == 'yes') {
                this.chkIgnorePlaylist = true;
            }
            this.recalculatePlaylistIndices();
        }
        chkShuffleChanged(event) {
            console.log(event.checked);
            if (event.checked)
                localStorage.setItem('MP3AudioShuffle', 'yes');
            else
                localStorage.setItem('MP3AudioShuffle', 'no');
            this.shuffleSongs();
        }
        chkIgnorePlaylistChanged(event) {
            console.log(event.checked);
            if (event.checked)
                localStorage.setItem('MP3AudioIgnorePlaylist', 'yes');
            else
                localStorage.setItem('MP3AudioIgnorePlaylist', 'no');
        }
        saveToLocalStorage() {
            let itemToSave = JSON.stringify(this.playlist);
            localStorage.setItem('MP3AudioPlaylist', itemToSave);
            itemToSave = JSON.stringify(this.allPlaylists);
            localStorage.setItem('MP3AudioAllPlaylists', itemToSave);
        }
        clearPlaylist() {
            this.playlist = [];
            this.saveToLocalStorage();
            toastr.info('Playlist Cleared');
        }
        btnPlaylistUp(item) {
            let song = this.playlist.find((song) => { return song.ID == item.id; });
            //can't move up first song
            if (song.PlaylistIndex == 1)
                return;
            this.playlist = this.playlist.filter((item) => { return item.PlaylistIndex != song.PlaylistIndex; });
            let newPlaylist = [];
            for (let i = 0; i < this.playlist.length; i++) {
                if (i == song.PlaylistIndex - 2)
                    newPlaylist.push(song);
                newPlaylist.push(this.playlist[i]);
            }
            this.playlist = newPlaylist;
            this.recalculatePlaylistIndices();
            this.saveToLocalStorage();
        }
        btnPlaylistDown(item) {
            let song = this.playlist.find((song) => { return song.ID == item.id; });
            //can't move down last song
            if (song.PlaylistIndex == this.playlist.length)
                return;
            this.playlist = this.playlist.filter((item) => { return item.PlaylistIndex != song.PlaylistIndex; });
            let newPlaylist = [];
            for (let i = 0; i < this.playlist.length; i++) {
                newPlaylist.push(this.playlist[i]);
                if (i == song.PlaylistIndex - 1)
                    newPlaylist.push(song);
            }
            this.playlist = newPlaylist;
            this.recalculatePlaylistIndices();
            this.saveToLocalStorage();
        }
        btnPlaylistRemoveItem(item) {
            let song = this.playlist.find((song) => { return song.ID == item.id; });
            this.playlist = this.playlist.filter((item) => { return item.PlaylistIndex != song.PlaylistIndex; });
            this.recalculatePlaylistIndices();
            this.saveToLocalStorage();
            this.shuffleSongs();
        }
        recalculatePlaylistIndices() {
            for (let i = 0; i < this.playlist.length; i++) {
                this.playlist[i].PlaylistIndex = i + 1;
            }
        }
        btnAddToPlaylist(item) {
            console.log(item.id);
            let song = this.audioFiles.find((song) => { return song.ID == item.id; });
            //prevent song from being added twice because it causes issues
            let songExists = this.playlist.find((i) => { return i.ID == song.ID; });
            if (songExists) {
                toastr.error('Song Already in Playlist');
                return;
            }
            console.log(song);
            toastr.success('Added - ' + song.Title);
            let songCopy = JSON.parse(JSON.stringify(song));
            this.playlist.push(songCopy);
            this.recalculatePlaylistIndices();
            this.saveToLocalStorage();
            this.shuffleSongs();
        }
        clearTabs() {
            document.getElementById('navPlaylists').classList.remove("active");
            document.getElementById('navPlaylists').classList.remove("bg-info");
            document.getElementById('navSongs').classList.remove("active");
            document.getElementById('navSongs').classList.remove("bg-info");
            document.getElementById('navOptions').classList.remove("active");
            document.getElementById('navOptions').classList.remove("bg-info");
        }
        btnSongs() {
            this.clearTabs();
            document.getElementById('navSongs').classList.add("bg-info");
            document.getElementById('navSongs').classList.add("active");
            this.currentTab = Tabs.TabSongs;
        }
        btnPlaylists() {
            this.clearTabs();
            document.getElementById('navPlaylists').classList.add("bg-info");
            document.getElementById('navPlaylists').classList.add("active");
            this.currentTab = Tabs.TabPlaylists;
        }
        btnOptions() {
            this.clearTabs();
            document.getElementById('navOptions').classList.add("bg-info");
            document.getElementById('navOptions').classList.add("active");
            this.currentTab = Tabs.TabOptions;
        }
        loadAudioFiles() {
            return __awaiter(this, void 0, void 0, function* () {
                var response = yield fetch('audio.json?v=' + Math.floor(Math.random() * 100000));
                var result = yield response.json(); //or request.text()
                //assign unique identifiers for each song
                let id = 1;
                result.forEach(file => {
                    file.Filename = file.Filename.substr(file.Filename.lastIndexOf('\\') + 1);
                    file.ID = id++;
                });
                this.audioFiles = result;
                console.log(result);
                this.audioFiles.forEach(file => {
                    this.audioFilesFiltered.push(file);
                });
                this.runPagingAndFiltering();
                this.configurePlayer();
                this.loadFromLocalStorage();
                this.shuffleSongs();
            });
        }
        configurePlayer() {
            this.audioPlayer = document.getElementById('myAudio');
            this.audioSource = document.getElementById('mySource');
            this.audioPlayer.addEventListener('ended', (event) => {
                console.log('song ended');
                window.myApp.songEnded();
            });
            this.audioPlayer.addEventListener('playing', (event) => {
                console.log('playing event');
                window.myApp.isPaused = false;
            });
            this.audioPlayer.addEventListener('pause', (event) => {
                console.log('paused event');
                window.myApp.isPaused = true;
            });
        }
        bindRivets() {
            rivets.formatters.ev = function (value, arg) { return eval(value + arg); };
            rivets.formatters.ev_string = function (value, arg) { let eval_string = "'" + value + "'" + arg; return eval(eval_string); };
            rivets.bind($('body'), { data: this });
        }
        songEnded() {
            if (this.addHocSongPlaying)
                this.addHocSongPlaying = false;
            else
                this.btnNext();
        }
        btnPrev() {
            this.currentFile--;
            this.addHocSongPlaying = false;
            if (this.playlist.length == 0) {
                if (this.currentFile < 0)
                    this.currentFile = this.audioFiles.length - 1;
            }
            else {
                if (this.currentFile < 0)
                    this.currentFile = this.playlist.length - 1;
            }
            this.btnPlayTrack();
        }
        btnNext() {
            this.currentFile++;
            this.addHocSongPlaying = false;
            if (this.playlist.length == 0) {
                if (this.currentFile >= this.audioFiles.length)
                    this.currentFile = 0;
            }
            else {
                if (this.currentFile >= this.playlist.length)
                    this.currentFile = 0;
            }
            this.btnPlayTrack();
        }
        btnPause() {
            this.audioPlayer.pause();
        }
        btnPlay() {
            if (this.firstTimePlay) {
                let mobileDevice = false;
                if (window.innerWidth < 600 || navigator.userAgent.toLocaleLowerCase().includes('iphone') ||
                    navigator.userAgent.toLocaleLowerCase().includes('ipad')) {
                    mobileDevice = true;
                }
                if (!mobileDevice) {
                    var noSleep = new NoSleep();
                    noSleep.enable();
                    console.log('started no sleep');
                }
                this.firstTimePlay = false;
                this.btnPlayTrack();
            }
            else {
                this.audioPlayer.play();
            }
        }
        btnPlayAdHoc(item) {
            console.log('ad hoc song', item.id);
            this.addHocSong = item.id;
            this.btnPlayTrack();
        }
        btnPlayTrack() {
            //kick it back to btnPlay() to start noSleep
            if (this.firstTimePlay) {
                this.btnPlay();
                return;
            }
            let playlistMode = false;
            if (this.addHocSong != 0) {
                console.log('starting up ad hoc song');
                this.currentAudioFile = this.audioFiles.find((song) => { return song.ID == this.addHocSong; });
                this.addHocSong = 0;
                this.addHocSongPlaying = true;
            }
            else if (this.playlist.length == 0 || this.chkIgnorePlaylist) {
                if (this.chkShuffle)
                    this.currentAudioFile = this.audioFiles[this.shuffleSongsOrder[this.currentFile]];
                else
                    this.currentAudioFile = this.audioFiles[this.currentFile];
            }
            else {
                playlistMode = true;
                if (this.chkShuffle)
                    this.currentAudioFile = this.playlist[this.shufflePlaylistOrder[this.currentFile]];
                else
                    this.currentAudioFile = this.playlist[this.currentFile];
            }
            //highlight playing song
            this.playlist.forEach(song => {
                song.IsPlaying = false;
                if (playlistMode && song.ID == this.currentAudioFile.ID)
                    song.IsPlaying = true;
            });
            //set title on iOS lock screen
            document.getElementById('myAudio').title = this.currentAudioFile.Title;
            this.audioSource.src = 'media/' + this.currentAudioFile.Filename;
            this.audioPlayer.load();
            this.audioPlayer.play();
        }
        shuffleSongs() {
            this.shuffleSongsOrder = [];
            this.shufflePlaylistOrder = [];
            //initial order
            for (let i = 0; i < this.audioFiles.length; i++) {
                this.shuffleSongsOrder.push(i);
            }
            //swaps
            for (let i = 0; i < this.shuffleSongsOrder.length; i++) {
                let rand = Math.floor(Math.random() * this.shuffleSongsOrder.length);
                let temp = this.shuffleSongsOrder[i];
                this.shuffleSongsOrder[i] = this.shuffleSongsOrder[rand];
                this.shuffleSongsOrder[rand] = temp;
            }
            //initial order
            for (let i = 0; i < this.playlist.length; i++) {
                this.shufflePlaylistOrder.push(i);
            }
            //swaps
            for (let i = 0; i < this.shufflePlaylistOrder.length; i++) {
                let rand = Math.floor(Math.random() * this.shufflePlaylistOrder.length);
                let temp = this.shufflePlaylistOrder[i];
                this.shufflePlaylistOrder[i] = this.shufflePlaylistOrder[rand];
                this.shufflePlaylistOrder[rand] = temp;
            }
            console.log('shuffle 1', this.shuffleSongsOrder);
            console.log('shuffle 2', this.shufflePlaylistOrder);
        }
    }
    exports.MyApp = MyApp;
    class Playlist {
        constructor() {
            this.Name = '';
            this.Playlist = [];
        }
    }
    exports.Playlist = Playlist;
    class AudioFile {
    }
    exports.AudioFile = AudioFile;
    var Tabs;
    (function (Tabs) {
        Tabs[Tabs["TabSongs"] = 1] = "TabSongs";
        Tabs[Tabs["TabPlaylists"] = 2] = "TabPlaylists";
        Tabs[Tabs["TabOptions"] = 3] = "TabOptions";
    })(Tabs = exports.Tabs || (exports.Tabs = {}));
    window.myApp = new MyApp();
});
//# sourceMappingURL=index.js.map