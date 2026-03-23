export default function handler(req, res) {
  try {
    const { payid, client_id, operator_ref, status } = req.query;

    return res.status(200).json({
      success: true,
      message: "KWIK Callback Test - Working!",
      received: {
        payid: payid || "not provided",
        client_id: client_id || "not provided",
        operator_ref: operator_ref || "not provided",
        status: status || "not provided"
      }
    });

  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message
    });
  }
}
