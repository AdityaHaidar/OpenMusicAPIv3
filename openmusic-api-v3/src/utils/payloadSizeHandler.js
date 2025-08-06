const payloadSizeHandler = (request, h) => {
  // Check if the payload is too large
  if (request.payload && request.payload.cover && request.payload.cover._data) {
    if (request.payload.cover._data.length > 512000) {
      const response = h.response({
        status: 'fail',
        message: 'Ukuran file terlalu besar. Maksimal 512KB',
      });
      response.code(413);
      return response.takeover();
    }
  }
  return h.continue;
};

module.exports = { payloadSizeHandler };