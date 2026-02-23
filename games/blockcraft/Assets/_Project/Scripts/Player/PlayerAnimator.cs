using UnityEngine;

namespace BlockCraft
{
    /// <summary>
    /// Handles player sprite animation (idle, walk, jump, mine, attack).
    /// Uses a simple frame-based approach without requiring Animator.
    /// </summary>
    public class PlayerAnimator : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private float walkFrameRate = 8f;

        [Header("Sprites (assign in inspector)")]
        [SerializeField] private Sprite idleSprite;
        [SerializeField] private Sprite[] walkSprites;
        [SerializeField] private Sprite jumpSprite;
        [SerializeField] private Sprite mineSprite;

        private PlayerController _controller;
        private float _animTimer;
        private int _currentFrame;

        private enum AnimState { Idle, Walk, Jump, Mine }
        private AnimState _state = AnimState.Idle;

        private void Start()
        {
            _controller = GetComponent<PlayerController>();
            if (spriteRenderer == null)
                spriteRenderer = GetComponentInChildren<SpriteRenderer>();
        }

        private void Update()
        {
            if (_controller == null || spriteRenderer == null) return;

            // Determine state
            AnimState newState;
            if (!_controller.IsGrounded)
                newState = AnimState.Jump;
            else if (Mathf.Abs(_controller.Rb.linearVelocity.x) > 0.5f)
                newState = AnimState.Walk;
            else
                newState = AnimState.Idle;

            if (newState != _state)
            {
                _state = newState;
                _currentFrame = 0;
                _animTimer = 0;
            }

            // Update animation
            _animTimer += Time.deltaTime;

            switch (_state)
            {
                case AnimState.Idle:
                    if (idleSprite != null) spriteRenderer.sprite = idleSprite;
                    break;

                case AnimState.Walk:
                    if (walkSprites != null && walkSprites.Length > 0)
                    {
                        float frameDuration = 1f / walkFrameRate;
                        if (_animTimer >= frameDuration)
                        {
                            _animTimer -= frameDuration;
                            _currentFrame = (_currentFrame + 1) % walkSprites.Length;
                        }
                        spriteRenderer.sprite = walkSprites[_currentFrame];
                    }
                    break;

                case AnimState.Jump:
                    if (jumpSprite != null) spriteRenderer.sprite = jumpSprite;
                    break;

                case AnimState.Mine:
                    if (mineSprite != null) spriteRenderer.sprite = mineSprite;
                    break;
            }
        }
    }
}
