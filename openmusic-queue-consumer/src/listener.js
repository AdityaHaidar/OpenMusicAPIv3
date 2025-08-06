class Listener {
  constructor(playlistService, mailSender) {
    this.playlistService = playlistService;
    this.mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());

      const playlist = await this.playlistService.getPlaylistById(playlistId);
      const result = await this.mailSender.sendEmail(targetEmail, JSON.stringify(playlist));

      console.log('Email berhasil dikirim dengan ID:', result.messageId);
    } catch (error) {
      console.error('Gagal mengirim email:', error.message);
    }
  }
}

module.exports = Listener;
