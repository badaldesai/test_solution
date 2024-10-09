const pooledDownload = async (connect, save, downloadList, maxConcurrency) => {
  let activeDownloads = 0;
  let downloadIndex = 0;
  let connectionFailed = false;
  const downloadFile = async (connection, url) => {
    const { download } = connection;
    try {
      const result = await download(url);
      await save(result);
    } catch (error) {
      throw error;
    }
  }

  const startDownload = async () => {
    while (downloadIndex < downloadList.length && !connectionFailed) {
      let connection;
      if (activeDownloads >= maxConcurrency) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }
      try {
        connection = await connect();
      } catch (error) {
        connectionFailed = true;
        throw new Error('connection failed');
      }
      const url = downloadList[downloadIndex];
      downloadIndex++;
      activeDownloads++;
      await downloadFile(connection, url);
      await connection.close();
      activeDownloads--;
    }
  }
  const workers = Array.from({ length: maxConcurrency }, startDownload);

  try {
    await Promise.all(workers);
  } catch (error) {
    throw error;
  }
}

module.exports = pooledDownload
