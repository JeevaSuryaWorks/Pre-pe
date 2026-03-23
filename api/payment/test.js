module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { payid, client_id, operator_ref, status } = req.query;

  return res.status(200).json({
    message: 'Test callback received',
    receivedParams: {
      payid,
      client_id,
      operator_ref,
      status
    }
  });
};
