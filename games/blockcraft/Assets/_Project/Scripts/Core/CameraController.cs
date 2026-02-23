using UnityEngine;

namespace BlockCraft
{
    public class CameraController : MonoBehaviour
    {
        public static CameraController Instance { get; private set; }

        [SerializeField] private Transform target;
        [SerializeField] private float smoothSpeed = 8f;
        [SerializeField] private Vector3 offset = new Vector3(0, 2f, -10f);
        [SerializeField] private float minY = 0f;

        private Camera _camera;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            _camera = GetComponent<Camera>();
        }

        private void Start()
        {
            if (_camera == null)
                _camera = Camera.main;

            if (_camera != null)
            {
                _camera.orthographic = true;
                _camera.orthographicSize = 12f;
            }
        }

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
        }

        private void LateUpdate()
        {
            if (target == null) return;

            Vector3 desiredPos = target.position + offset;
            desiredPos.y = Mathf.Max(desiredPos.y, minY);

            // Clamp to world bounds
            if (_camera != null)
            {
                float halfHeight = _camera.orthographicSize;
                float halfWidth = halfHeight * _camera.aspect;

                desiredPos.x = Mathf.Clamp(desiredPos.x, halfWidth, Constants.WorldWidth - halfWidth);
                desiredPos.y = Mathf.Clamp(desiredPos.y, halfHeight, Constants.WorldHeight - halfHeight);
            }

            Vector3 smoothed = Vector3.Lerp(transform.position, desiredPos, smoothSpeed * Time.deltaTime);
            smoothed.z = offset.z;
            transform.position = smoothed;
        }

        public void SnapToTarget()
        {
            if (target == null) return;
            Vector3 pos = target.position + offset;
            pos.z = offset.z;
            transform.position = pos;
        }

        public Camera Cam => _camera;
    }
}
