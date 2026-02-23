using System;
using UnityEngine;

namespace BlockCraft
{
    public class PlayerStats : MonoBehaviour
    {
        public static PlayerStats Instance { get; private set; }

        [Header("Health")]
        [SerializeField] private float maxHealth = Constants.PlayerMaxHealth;
        [SerializeField] private float currentHealth;

        [Header("Hunger")]
        [SerializeField] private float maxHunger = Constants.PlayerMaxHunger;
        [SerializeField] private float currentHunger;
        [SerializeField] private float hungerDrainRate = Constants.HungerDrainRate;
        [SerializeField] private float starvationDamage = Constants.StarvationDamage;

        [Header("Invincibility")]
        [SerializeField] private float invincibilityDuration = 0.5f;
        private float _invincibilityTimer;

        private bool _isDead;

        public float Health => currentHealth;
        public float MaxHealth => maxHealth;
        public float Hunger => currentHunger;
        public float MaxHunger => maxHunger;
        public float HealthPercent => currentHealth / maxHealth;
        public float HungerPercent => currentHunger / maxHunger;
        public bool IsDead => _isDead;

        public event Action<float, float> OnHealthChanged;  // current, max
        public event Action<float, float> OnHungerChanged;   // current, max
        public event Action OnDeath;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            currentHealth = maxHealth;
            currentHunger = maxHunger;
        }

        private void Update()
        {
            if (_isDead) return;

            // Invincibility timer
            if (_invincibilityTimer > 0)
                _invincibilityTimer -= Time.deltaTime;

            // Hunger drain
            currentHunger -= hungerDrainRate * Time.deltaTime;
            currentHunger = Mathf.Max(currentHunger, 0);
            OnHungerChanged?.Invoke(currentHunger, maxHunger);

            // Starvation damage
            if (currentHunger <= 0)
            {
                TakeDamage(starvationDamage * Time.deltaTime);
            }

            // Health regeneration when hunger is high
            if (currentHunger >= maxHunger * 0.8f && currentHealth < maxHealth)
            {
                currentHealth = Mathf.Min(currentHealth + 0.5f * Time.deltaTime, maxHealth);
                OnHealthChanged?.Invoke(currentHealth, maxHealth);
            }
        }

        public void TakeDamage(float damage)
        {
            if (_isDead) return;
            if (_invincibilityTimer > 0 && damage > 0.1f) return; // Allow starvation tick damage

            currentHealth -= damage;
            currentHealth = Mathf.Max(currentHealth, 0);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);

            if (damage > 0.1f)
                _invincibilityTimer = invincibilityDuration;

            if (currentHealth <= 0)
            {
                Die();
            }
        }

        public void Heal(float amount)
        {
            if (_isDead) return;
            currentHealth = Mathf.Min(currentHealth + amount, maxHealth);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public void Feed(float amount)
        {
            currentHunger = Mathf.Min(currentHunger + amount, maxHunger);
            OnHungerChanged?.Invoke(currentHunger, maxHunger);
        }

        public void ConsumeItem(ItemData item)
        {
            if (item == null || !item.IsConsumable) return;
            if (item.healthRestore > 0) Heal(item.healthRestore);
            if (item.hungerRestore > 0) Feed(item.hungerRestore);
        }

        private void Die()
        {
            _isDead = true;
            Debug.Log("[BlockCraft] Player died!");
            OnDeath?.Invoke();

            // Drop all items
            InventoryManager.Instance?.DropAllItems();

            // Respawn after delay
            Invoke(nameof(Respawn), 3f);
        }

        private void Respawn()
        {
            _isDead = false;
            currentHealth = maxHealth;
            currentHunger = maxHunger;
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
            OnHungerChanged?.Invoke(currentHunger, maxHunger);

            GameManager.Instance?.Respawn();
        }

        public void ResetStats()
        {
            _isDead = false;
            currentHealth = maxHealth;
            currentHunger = maxHunger;
            _invincibilityTimer = 0;
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
            OnHungerChanged?.Invoke(currentHunger, maxHunger);
        }
    }
}
