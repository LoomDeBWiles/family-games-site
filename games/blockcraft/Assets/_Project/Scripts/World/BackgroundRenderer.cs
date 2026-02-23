using UnityEngine;

namespace BlockCraft
{
    public class BackgroundRenderer : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer skyRenderer;
        [SerializeField] private SpriteRenderer[] parallaxLayers;
        [SerializeField] private float[] parallaxSpeeds;

        private Camera _cam;
        private Vector3 _lastCamPos;

        private void Start()
        {
            _cam = Camera.main;
            if (_cam != null)
                _lastCamPos = _cam.transform.position;

            if (skyRenderer == null)
                CreateSky();
        }

        private void CreateSky()
        {
            var skyGO = new GameObject("Sky");
            skyGO.transform.SetParent(transform);
            skyRenderer = skyGO.AddComponent<SpriteRenderer>();
            skyRenderer.sortingOrder = -100;

            // Create a large sky sprite
            var tex = new Texture2D(1, 1);
            tex.SetPixel(0, 0, Color.white);
            tex.Apply();
            skyRenderer.sprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
            skyGO.transform.localScale = new Vector3(500, 500, 1);
        }

        private void Update()
        {
            if (_cam == null) return;

            // Update sky color based on time
            if (TimeManager.Instance != null && skyRenderer != null)
            {
                skyRenderer.color = TimeManager.Instance.GetSkyColor();
                skyRenderer.transform.position = new Vector3(
                    _cam.transform.position.x,
                    _cam.transform.position.y,
                    50 // Behind everything
                );
            }

            // Parallax scrolling
            if (parallaxLayers != null)
            {
                Vector3 delta = _cam.transform.position - _lastCamPos;
                for (int i = 0; i < parallaxLayers.Length && i < parallaxSpeeds.Length; i++)
                {
                    if (parallaxLayers[i] != null)
                    {
                        parallaxLayers[i].transform.position += new Vector3(
                            delta.x * parallaxSpeeds[i],
                            delta.y * parallaxSpeeds[i] * 0.5f,
                            0
                        );
                    }
                }
            }

            _lastCamPos = _cam.transform.position;
        }
    }
}
