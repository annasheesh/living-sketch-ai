/**
 * CoordinateMapper
 * Maps normalized coordinates from MediaPipe (video frame space: [0,1] x [0,1])
 * to screen/canvas pixel coordinates, accounting for:
 * 1. Mirror mode (horizontal flip)
 * 2. `object-fit: cover` scaling and letterboxing/cropping offsets
 * 3. Screen dimensions
 */

export interface ScreenMappingParams {
  containerWidth: number;
  containerHeight: number;
  videoWidth: number;
  videoHeight: number;
  isMirrored: boolean;
}

export class CoordinateMapper {
  /**
   * Computes the display metrics for video rendered with object-fit: cover
   */
  public static computeCoverMetrics(
    containerWidth: number,
    containerHeight: number,
    videoWidth: number,
    videoHeight: number
  ) {
    if (videoWidth <= 0 || videoHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
      return {
        displayedWidth: containerWidth,
        displayedHeight: containerHeight,
        offsetX: 0,
        offsetY: 0,
        scale: 1
      };
    }

    const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight);
    const displayedWidth = videoWidth * scale;
    const displayedHeight = videoHeight * scale;
    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;

    return {
      displayedWidth,
      displayedHeight,
      offsetX,
      offsetY,
      scale
    };
  }

  /**
   * Maps a normalized landmark point (nx, ny in [0, 1]) to container pixel coordinates (x, y)
   */
  public static mapNormalizedToScreen(
    nx: number,
    ny: number,
    params: ScreenMappingParams
  ): { x: number; y: number } {
    const { containerWidth, containerHeight, videoWidth, videoHeight, isMirrored } = params;

    const metrics = this.computeCoverMetrics(
      containerWidth,
      containerHeight,
      videoWidth,
      videoHeight
    );

    // If mirrored, flip horizontal coordinate: (1 - nx)
    const effectiveNx = isMirrored ? (1 - nx) : nx;

    const screenX = metrics.offsetX + effectiveNx * metrics.displayedWidth;
    const screenY = metrics.offsetY + ny * metrics.displayedHeight;

    return {
      x: screenX,
      y: screenY
    };
  }

  /**
   * Inverse map from screen pixel coordinates back to normalized video coordinates
   */
  public static mapScreenToNormalized(
    screenX: number,
    screenY: number,
    params: ScreenMappingParams
  ): { nx: number; ny: number } {
    const { containerWidth, containerHeight, videoWidth, videoHeight, isMirrored } = params;

    const metrics = this.computeCoverMetrics(
      containerWidth,
      containerHeight,
      videoWidth,
      videoHeight
    );

    let normX = (screenX - metrics.offsetX) / metrics.displayedWidth;
    const normY = (screenY - metrics.offsetY) / metrics.displayedHeight;

    if (isMirrored) {
      normX = 1 - normX;
    }

    return {
      nx: Math.max(0, Math.min(1, normX)),
      ny: Math.max(0, Math.min(1, normY))
    };
  }
}
