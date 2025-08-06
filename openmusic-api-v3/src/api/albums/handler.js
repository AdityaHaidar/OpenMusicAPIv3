const ClientError = require('../../exceptions/ClientError');

class AlbumsHandler {
  constructor(service, storageService, validator, uploadsValidator) {
    this.service = service;
    this.storageService = storageService;
    this.validator = validator;
    this.uploadsValidator = uploadsValidator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
    this.postLikeAlbumHandler = this.postLikeAlbumHandler.bind(this);
    this.deleteLikeAlbumHandler = this.deleteLikeAlbumHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    try {
      this.validator.validateAlbumPayload(request.payload);
      const { name, year } = request.payload;

      const albumId = await this.service.addAlbum({ name, year });

      const response = h.response({
        status: 'success',
        data: {
          albumId,
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

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getAlbumByIdHandler(request, h) {
    try {
      const { id } = request.params;
      const album = await this.service.getAlbumWithSongs(id);

      return {
        status: 'success',
        data: {
          album,
        },
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

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async putAlbumByIdHandler(request, h) {
    try {
      this.validator.validateAlbumPayload(request.payload);
      const { id } = request.params;

      await this.service.editAlbumById(id, request.payload);

      return {
        status: 'success',
        message: 'Album berhasil diperbarui',
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

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deleteAlbumByIdHandler(request, h) {
    try {
      const { id } = request.params;
      await this.service.deleteAlbumById(id);

      return {
        status: 'success',
        message: 'Album berhasil dihapus',
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

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async postUploadImageHandler(request, h) {
    try {
      const { cover } = request.payload;
      const { id } = request.params;

      console.log('Upload handler called');
      console.log('Cover:', cover);
      console.log('Album ID:', id);

      // Check if album exists first
      await this.service.getAlbumById(id);

      // Validate if cover is provided
      if (!cover) {
        const response = h.response({
          status: 'fail',
          message: 'Cover album harus disertakan',
        });
        response.code(400);
        return response;
      }

      // Check if it's a valid file object
      if (!cover.hapi || !cover.hapi.headers) {
        const response = h.response({
          status: 'fail',
          message: 'File tidak valid',
        });
        response.code(400);
        return response;
      }

      console.log('Headers:', cover.hapi.headers);

      // Validate image headers
      this.uploadsValidator.validateImageHeaders(cover.hapi.headers);

      const filename = await this.storageService.writeFile(cover, cover.hapi);

      // Handle different storage services
      let coverUrl;
      if (process.env.AWS_BUCKET_NAME) {
        // S3 returns full URL
        coverUrl = filename;
      } else {
        // Local storage needs host prefix
        const host = process.env.HOST || 'localhost';
        const port = process.env.PORT || 5000;
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        coverUrl = `${protocol}://${host}:${port}/upload/images/${filename}`;
      }

      await this.service.addAlbumCover(id, coverUrl);

      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      });
      response.code(201);
      return response;
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Handle specific upload errors
      if (error.message && error.message.includes('Invalid content-type')) {
        const response = h.response({
          status: 'fail',
          message: 'Format file tidak valid. Harus berupa gambar.',
        });
        response.code(400);
        return response;
      }

      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      return response;
    }
  }

  async postLikeAlbumHandler(request, h) {
    try {
      const { id } = request.params;
      const { userId } = request.auth.credentials;

      await this.service.likeAlbum(userId, id);

      const response = h.response({
        status: 'success',
        message: 'Album berhasil disukai',
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

  async deleteLikeAlbumHandler(request, h) {
    try {
      const { id } = request.params;
      const { userId } = request.auth.credentials;

      await this.service.unlikeAlbum(userId, id);

      return {
        status: 'success',
        message: 'Album batal disukai',
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

  async getAlbumLikesHandler(request, h) {
    try {
      const { id } = request.params;

      const result = await this.service.getAlbumLikes(id);

      const response = h.response({
        status: 'success',
        data: {
          likes: result.likes,
        },
      });

      if (result.source === 'cache') {
        response.header('X-Data-Source', 'cache');
      }

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
}

module.exports = AlbumsHandler;