/**
 * AI Service Client: Communicates with FastAPI YOLOv8 microservice
 */
const detectRoadDamage = async (imageBuffer, originalname = 'road.jpg') => {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  try {
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, originalname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(`${aiServiceUrl}/detect`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[AI Service] Detection endpoint returned HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return {
      hasDamage: result.has_damage || false,
      detectedClasses: result.detected_classes || [],
      totalDetections: result.total_detections || 0,
      severityScore: result.severity_score || 0,
      recommendedPriority: result.recommended_priority || 'low',
      detections: (result.detections || []).map((d) => ({
        classId: d.class_id,
        className: d.class_name,
        confidence: d.confidence,
        box: d.box
      })),
      annotatedImageBase64: result.annotated_image_base64 || null
    };
  } catch (err) {
    console.warn(`[AI Service] YOLO detection call failed: ${err.message}. Proceeding without AI inference.`);
    return null;
  }
};

module.exports = {
  detectRoadDamage
};
