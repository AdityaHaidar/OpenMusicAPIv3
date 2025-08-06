const { Pool } = require('pg');

class PlaylistService {
  constructor() {
    this.pool = new Pool();
  }

  async getPlaylistById(playlistId) {
    const playlistQuery = {
      text: 'SELECT p.id, p.name FROM playlists p WHERE p.id = $1',
      values: [playlistId],
    };

    const playlistResult = await this.pool.query(playlistQuery);

    if (!playlistResult.rows.length) {
      throw new Error('Playlist tidak ditemukan');
    }

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer FROM songs s 
             LEFT JOIN playlist_songs ps ON ps.song_id = s.id 
             WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };

    const songsResult = await this.pool.query(songsQuery);

    return {
      playlist: {
        ...playlistResult.rows[0],
        songs: songsResult.rows,
      },
    };
  }
}

module.exports = PlaylistService;
