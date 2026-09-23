# Neural network reference

The current hero uses original procedural 3D particle geometry. Its branching blue fibers, layered neurons, and progressively illuminated signal nodes follow the neural network direction in the user-provided visual reference. It is an artistic visualization, not a medically exact anatomical model.

The architectural finale uses the user-supplied `blueprient-to-house.mp4` (10.04 seconds). The white particle blueprint is sampled from the first video frame (32,768 points in `app/blueprint-points.json`) and assembled progressively, then crossfades to the supplied video, whose frame is controlled by scroll in both directions. `public/video/blueprint-to-house.mp4` is a muted 1280×720 H.264 derivative (~5.4 MB, frequent keyframes) for local playback. The completed white drawing remains visible as the loading/error fallback. Its 16:9 plane matches the video rectangle on desktop and mobile; playback begins only after the initial crossfade. This replaces the earlier Casa Marea website-layout study.

The current sequence is GM, centered product presentation, brain, neural signal, progressively drawn blueprint, and the architectural video. All transitions reverse with scroll. Hover and drag affect every particle construction, settling to the reference pose before the video. The neural network scatters before reassembling into the drawing. The original high-bitrate source remains outside the public website bundle.

The earlier two-terminal study used Alfred Pasieka / Science Photo Library's [Synapse illustration](https://sciencephotogallery.com/featured/2-synapse-illustration-alfred-pasiekascience-photo-library.html) as a composition reference. That terminal composition is no longer used in the current scene.
