using UnityEngine;

namespace BlockCraft
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class Projectile : MonoBehaviour
    {
        private float _speed;
        private float _damage;
        private string _targetTag;
        private float _lifetime;
        private Vector2 _direction;
        private Rigidbody2D _rb;
        private bool _initialized;

        public void Initialize(Vector2 direction, float speed, float damage, string targetTag, float lifetime = 5f)
        {
            _direction = direction.normalized;
            _speed = speed;
            _damage = damage;
            _targetTag = targetTag;
            _lifetime = lifetime;
            _initialized = true;

            _rb = GetComponent<Rigidbody2D>();
            if (_rb != null)
            {
                _rb.linearVelocity = _direction * _speed;
            }

            Destroy(gameObject, _lifetime);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!_initialized) return;

            // Hit enemy
            if (_targetTag == "Enemy")
            {
                var enemy = other.GetComponent<EnemyBase>();
                if (enemy != null && !enemy.IsDead)
                {
                    Vector2 knockDir = _direction * 3f;
                    enemy.TakeDamage(_damage, knockDir);
                    Destroy(gameObject);
                    return;
                }
            }

            // Hit player
            if (_targetTag == "Player")
            {
                var player = other.GetComponent<PlayerController>();
                if (player != null)
                {
                    PlayerStats.Instance?.TakeDamage(_damage);
                    if (PlayerController.Instance != null)
                    {
                        PlayerController.Instance.Rb.AddForce(_direction * 3f, ForceMode2D.Impulse);
                    }
                    Destroy(gameObject);
                    return;
                }
            }

            // Hit terrain (any non-trigger collider that isn't our target)
            if (!other.isTrigger && other.GetComponent<PlayerController>() == null && other.GetComponent<EnemyBase>() == null)
            {
                Destroy(gameObject);
            }
        }
    }
}
