# Bring Spotify playlists into SoundTrip with a Free account

SoundTrip imports playlist metadata from your official Spotify account-data download. It does not require a Spotify developer app or Premium subscription. Imported files contain playlist/song information, not playable Spotify audio.

## Request and download the export

1. Open [Spotify Account Privacy](https://www.spotify.com/account/privacy/) and sign in to Spotify there.
2. Find **Download your data** and request **Account data**. This is the package containing playlist information; extended streaming history is a different package and cannot be imported as playlists.
3. Complete Spotify's request confirmation steps and wait until Spotify makes the download available. Follow the time estimate displayed by Spotify.
4. Download the ZIP and extract it with your device's archive/file application.
5. Locate playlist JSON files, normally named `Playlist1.json`, `Playlist2.json`, and similar. Keep them on the device where you will use SoundTrip. Do not choose the whole ZIP, user-details files, or streaming-history files.

Spotify describes the official export contents in [Understanding your data](https://support.spotify.com/us/article/understanding-your-data/) and the download process in [Data rights and privacy choices](https://support.spotify.com/us/article/data-rights-and-privacy-settings/).

## Import and match files

1. Open **Playlists → Import Spotify export**. The Spotify connection page has the same button.
2. Choose **Choose playlist JSON** and select one or several extracted playlist files through your operating system's picker.
3. Review the playlist names, song counts and skipped-item count. Uncheck any playlist you do not want, then choose **Import selected playlists**. **Cancel import** leaves the existing library untouched.
4. Select an imported snapshot. Choose **Import local music** to add audio files you already own, if needed.
5. Check each suggestion's title, artist and filename, then choose **Confirm file**. SoundTrip never confirms a suggestion automatically. If metadata differs, choose **Choose a local file** and search your library manually.
6. Choose **Create local playlist** to make an editable copy containing confirmed local tracks in export order. Repeated songs remain repeated. Unmatched songs remain visible in the export snapshot and are not added as playable audio.
7. Use **Shuffle confirmed files** for tracks available on this device, or open the created local playlist for ordinary play, shuffle, rename and queue controls.

The created playlist is a copy. Later changes to export matching do not overwrite your edits; add newly matched songs through ordinary Playlists controls. If audio becomes unavailable, its export link and playlist metadata stay. Relink the audio from its local-library details.

Created local playlists follow the existing 10,000-track limit. Names longer than 120 characters are shortened for the local copy, with a visible notice; the imported snapshot keeps its name.

## Privacy, refresh and limits

- Playlist names, song/artist/album names, valid Spotify track links where included, and local-track references are kept on the current device. Unrelated account fields and original JSON are not retained in SoundTrip's library. Native temporary picker copies are removed after reading.
- Export snapshots are separate from live Spotify API data. They remain until **Remove export metadata** is confirmed and are not deleted by Spotify disconnect or API expiry. Removing one does not delete audio or a local playlist already created from it.
- Export metadata and device matching are not cloud synced. Ordinary local playlists created from confirmed tracks use the existing private metadata-sync behavior. Audio still needs to be transferred and imported explicitly on another device.
- Reimporting identical contents skips the duplicate and preserves existing matching. Changed names or song contents/order create a separate snapshot, preserving the previous one. You can remove old snapshots yourself.
- This importer does not contact Spotify, scrape websites, download audio or access Spotify downloads. Getting the initial export and opening Spotify links require internet; importing a downloaded file and playing local audio do not.
- Files must be extracted JSON. Maximum 20 files, 10 MB each, 20 MB combined, 1,000 playlists and 20,000 source items per import. Empty playlists are retained; podcasts and unreadable songs are skipped and counted.
- Supported structure is Spotify account-data JSON with a `playlists` array containing playlist `name` and `items`, and song fields under `track` / local metadata under `localTrack`. If Spotify changes its export format, an unsupported-format error preserves the existing library. CSV files and streaming-history exports are not supported.

No Spotify credentials need to be placed in `.env.local` for this workflow. The previously implemented OAuth connection remains optional and separately subject to Spotify's developer-account requirements.
