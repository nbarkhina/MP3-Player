using System;
using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace scannercore
{
    public class AudioFile
    {
        public string Filename { get; set; }
        public string Title { get; set; }
        public string Artist { get; set; }
        public string Album { get; set; }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var files = Directory.GetFiles(Directory.GetCurrentDirectory() + "\\..\\media", "*.mp3",SearchOption.AllDirectories);
            List<AudioFile> audioFiles = new List<AudioFile>();

            foreach(string file in files)
            {
                var tfile = TagLib.File.Create(file);
                var audio = new AudioFile();
                audio.Filename = file.Substring(file.IndexOf("media")+6).Replace("\\","/");
                audio.Title = tfile.Tag.Title;
                if (string.IsNullOrEmpty(audio.Title))
                    audio.Title = audio.Filename.Substring(audio.Filename.LastIndexOf("/") + 1);
                #pragma warning disable 0618
                audio.Artist = tfile.Tag.FirstArtist;
                if (string.IsNullOrEmpty(audio.Artist))
                    audio.Artist = "";
                audio.Album = tfile.Tag.Album;
                if (string.IsNullOrEmpty(audio.Album))
                    audio.Album = "";
                audioFiles.Add(audio);
            }

            File.WriteAllText(Directory.GetCurrentDirectory() + "\\..\\audio.json", JsonConvert.SerializeObject(audioFiles));
        }
    }
}
