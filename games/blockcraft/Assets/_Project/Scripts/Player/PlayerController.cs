using UnityEngine;

namespace BlockCraft
{
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(BoxCollider2D))]
    public class PlayerController : MonoBehaviour
    {
        public static PlayerController Instance { get; private set; }

        [Header("Movement")]
        [SerializeField] private float moveSpeed = Constants.PlayerMoveSpeed;
        [SerializeField] private float jumpForce = Constants.PlayerJumpForce;

        [Header("Ground Check")]
        [SerializeField] private Transform groundCheck;
        [SerializeField] private float groundCheckRadius = 0.2f;
        [SerializeField] private LayerMask groundMask;

        private Rigidbody2D _rb;
        private BoxCollider2D _collider;
        private SpriteRenderer _spriteRenderer;
        private bool _isGrounded;
        private float _horizontalInput;
        private bool _jumpRequested;
        private bool _facingRight = true;

        public bool IsGrounded => _isGrounded;
        public bool FacingRight => _facingRight;
        public Rigidbody2D Rb => _rb;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            _rb = GetComponent<Rigidbody2D>();
            _collider = GetComponent<BoxCollider2D>();
            _spriteRenderer = GetComponentInChildren<SpriteRenderer>();

            _rb.freezeRotation = true;
            _rb.gravityScale = 3f;
            _rb.interpolation = RigidbodyInterpolation2D.Interpolate;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;

            // Create ground check if not assigned
            if (groundCheck == null)
            {
                var go = new GameObject("GroundCheck");
                go.transform.SetParent(transform);
                go.transform.localPosition = new Vector3(0, -0.55f, 0);
                groundCheck = go.transform;
            }
        }

        private void Update()
        {
            // Input
            _horizontalInput = Input.GetAxisRaw("Horizontal");

            if (Input.GetButtonDown("Jump") && _isGrounded)
            {
                _jumpRequested = true;
            }

            // Flip sprite
            if (_horizontalInput > 0 && !_facingRight) Flip();
            else if (_horizontalInput < 0 && _facingRight) Flip();
        }

        private void FixedUpdate()
        {
            // Ground check
            _isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundMask);

            // Horizontal movement
            _rb.linearVelocity = new Vector2(_horizontalInput * moveSpeed, _rb.linearVelocity.y);

            // Jump
            if (_jumpRequested)
            {
                _rb.linearVelocity = new Vector2(_rb.linearVelocity.x, jumpForce);
                _jumpRequested = false;
            }
        }

        private void Flip()
        {
            _facingRight = !_facingRight;
            if (_spriteRenderer != null)
                _spriteRenderer.flipX = !_facingRight;
        }

        public void TeleportTo(Vector2 position)
        {
            transform.position = new Vector3(position.x, position.y, 0);
            _rb.linearVelocity = Vector2.zero;
        }
    }
}
