using UnityEngine;

namespace BlockCraft
{
    [CreateAssetMenu(fileName = "NewEnemy", menuName = "BlockCraft/Enemy Data")]
    public class EnemyData : ScriptableObject
    {
        [Header("Identity")]
        public string enemyName;
        public Sprite sprite;
        public Color tintColor = Color.white;

        [Header("Stats")]
        public float maxHealth = 20f;
        public float moveSpeed = 3f;
        public float attackDamage = 10f;
        public float attackSpeed = 1f;    // Attacks per second
        public float attackRange = 1.5f;
        public float detectionRange = 15f;
        public float knockbackForce = 5f;

        [Header("Behavior")]
        public bool nightOnly = true;
        public bool burnsInDaylight = false;
        public float daylightDamage = 5f;  // Per second
        public bool isFlying = false;

        [Header("Drops")]
        public EnemyDrop[] dropTable;

        [Header("Visuals")]
        public Vector2 colliderSize = new Vector2(0.8f, 1.5f);
        public RuntimeAnimatorController animatorController;

        [System.Serializable]
        public struct EnemyDrop
        {
            public ItemData item;
            public int minCount;
            public int maxCount;
            public float dropChance; // 0-1
        }
    }
}
