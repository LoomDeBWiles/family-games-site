using UnityEngine;

namespace BlockCraft
{
    public class SkeletonEnemy : EnemyBase
    {
        [SerializeField] private float shootRange = 10f;
        [SerializeField] private float retreatRange = 4f;
        [SerializeField] private GameObject projectilePrefab;

        protected override void UpdateAI()
        {
            if (playerTransform == null) return;

            float distToPlayer = Vector2.Distance(transform.position, playerTransform.position);

            if (distToPlayer <= data.detectionRange)
            {
                if (distToPlayer < retreatRange)
                {
                    // Too close - retreat
                    RetreatFromPlayer();
                }
                else if (distToPlayer <= shootRange)
                {
                    // In range - stop and shoot
                    rb.linearVelocity = new Vector2(0, rb.linearVelocity.y);
                    FacePlayer();

                    if (attackCooldown <= 0)
                    {
                        ShootProjectile();
                        attackCooldown = 1f / data.attackSpeed;
                    }
                }
                else
                {
                    // Approach
                    MoveTowardPlayer();
                }
            }
            else
            {
                Idle();
            }
        }

        private void FacePlayer()
        {
            float dir = Mathf.Sign(playerTransform.position.x - transform.position.x);
            if ((dir > 0 && !facingRight) || (dir < 0 && facingRight))
            {
                facingRight = !facingRight;
                spriteRenderer.flipX = !facingRight;
            }
        }

        private void RetreatFromPlayer()
        {
            float dir = -Mathf.Sign(playerTransform.position.x - transform.position.x);
            rb.linearVelocity = new Vector2(dir * data.moveSpeed, rb.linearVelocity.y);

            if ((dir > 0 && !facingRight) || (dir < 0 && facingRight))
            {
                facingRight = !facingRight;
                spriteRenderer.flipX = !facingRight;
            }
        }

        private void ShootProjectile()
        {
            Vector2 dir = ((Vector2)playerTransform.position - (Vector2)transform.position).normalized;
            Vector2 spawnPos = (Vector2)transform.position + dir * 0.5f;

            var projGO = new GameObject("BoneProjectile");
            projGO.transform.position = spawnPos;

            var projectile = projGO.AddComponent<Projectile>();
            projectile.Initialize(dir, 12f, data.attackDamage, "Player", 5f);

            // Visual
            var sr = projGO.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 9;
            sr.color = new Color(0.9f, 0.85f, 0.75f);

            // Create bone sprite
            var tex = new Texture2D(8, 4);
            tex.filterMode = FilterMode.Point;
            var pixels = new Color[32];
            for (int i = 0; i < pixels.Length; i++)
                pixels[i] = Color.white;
            tex.SetPixels(pixels);
            tex.Apply();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, 8, 4), new Vector2(0.5f, 0.5f), Constants.PixelsPerUnit);

            var collider = projGO.AddComponent<CircleCollider2D>();
            collider.radius = 0.15f;
            collider.isTrigger = true;

            var rb2d = projGO.AddComponent<Rigidbody2D>();
            rb2d.gravityScale = 0.3f;
        }
    }
}
