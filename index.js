class ConnectError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConnectError';
    this.message = 'connection failed';
  }
}

const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
  let downloadIndex = 0;
  const connections = [];

  for (let i = 0; i < maxConcurrency; i++) {
    try {
      const connection = await connect();
      connections.push(connection);
    } catch (error) {
      if (connections.length === 0) {
        throw new ConnectError();
      }
      break;
    }
  }

  const startDownload = async (connection) => {
    try {
      while (downloadIndex < downloadList.length) {
        const url = downloadList[downloadIndex];
        downloadIndex++;
        const { download } = connection;
        const result = await download(url);
        await save(result);
      }
    } catch (error) {
      throw error;
    } finally {
      await connection.close();
    }
  }
  
  try {
    const promises = await Promise.allSettled(connections.map((connection) => startDownload(connection)));
    const allFullfilled = promises.every((promise) => promise.status === 'fulfilled');
    if (!allFullfilled) {
      throw promises[0].reason;
    }
  } catch (error) {
    throw error;
  }
}

module.exports = pooledDownload
