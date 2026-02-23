using UnityEngine;

namespace BlockCraft
{
    /// <summary>
    /// Central damage calculation utility.
    /// </summary>
    public static class DamageSystem
    {
        public static float CalculateMeleeDamage(ItemData weapon, float baseDamage = 1f)
        {
            if (weapon == null) return baseDamage;
            return weapon.attackDamage;
        }

        public static float CalculateRangedDamage(ItemData weapon)
        {
            if (weapon == null) return 1f;
            return weapon.attackDamage;
        }

        public static Vector2 CalculateKnockback(Vector3 attackerPos, Vector3 targetPos, float force)
        {
            Vector2 dir = ((Vector2)targetPos - (Vector2)attackerPos).normalized;
            dir.y = Mathf.Max(dir.y, 0.3f); // Always knock up a bit
            return dir * force;
        }

        public static void ApplyDamageToEnemy(EnemyBase enemy, float damage, Vector3 attackerPos, float knockbackForce)
        {
            if (enemy == null || enemy.IsDead) return;

            Vector2 knockback = CalculateKnockback(attackerPos, enemy.transform.position, knockbackForce);
            enemy.TakeDamage(damage, knockback);
        }

        public static void ApplyDamageToPlayer(float damage, Vector3 attackerPos, float knockbackForce)
        {
            if (PlayerStats.Instance == null || PlayerStats.Instance.IsDead) return;

            PlayerStats.Instance.TakeDamage(damage);

            if (PlayerController.Instance != null)
            {
                Vector2 knockback = CalculateKnockback(attackerPos, PlayerController.Instance.transform.position, knockbackForce);
                PlayerController.Instance.Rb.AddForce(knockback, ForceMode2D.Impulse);
            }
        }
    }
}
