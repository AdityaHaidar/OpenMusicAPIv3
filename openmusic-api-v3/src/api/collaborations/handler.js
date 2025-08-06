const ClientError = require('../../exceptions/ClientError');

class CollaborationsHandler {
  constructor(collaborationsService, playlistsService, usersService, validator) {
    this.collaborationsService = collaborationsService;
    this.playlistsService = playlistsService;
    this.usersService = usersService;
    this.validator = validator;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    try {
      this.validator.validateCollaborationPayload(request.payload);
      const { playlistId, userId } = request.payload;
      const { userId: credentialId } = request.auth.credentials;

      await this.playlistsService.verifyPlaylistOwner(playlistId, credentialId);
      await this.usersService.getUserById(userId);
      const collaborationId = await this.collaborationsService.addCollaboration(playlistId, userId);

      const response = h.response({
        status: 'success',
        data: {
          collaborationId,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deleteCollaborationHandler(request, h) {
    try {
      this.validator.validateCollaborationPayload(request.payload);
      const { playlistId, userId } = request.payload;
      const { userId: credentialId } = request.auth.credentials;

      await this.playlistsService.verifyPlaylistOwner(playlistId, credentialId);
      await this.collaborationsService.deleteCollaboration(playlistId, userId);

      return {
        status: 'success',
        message: 'Kolaborasi berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = CollaborationsHandler;
