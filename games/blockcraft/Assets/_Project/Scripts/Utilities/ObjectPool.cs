using System.Collections.Generic;
using UnityEngine;

namespace BlockCraft
{
    public class ObjectPool : MonoBehaviour
    {
        public static ObjectPool Instance { get; private set; }

        private Dictionary<string, Queue<GameObject>> _pools = new Dictionary<string, Queue<GameObject>>();
        private Dictionary<string, GameObject> _prefabs = new Dictionary<string, GameObject>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void CreatePool(string key, GameObject prefab, int initialSize)
        {
            if (_pools.ContainsKey(key)) return;

            _prefabs[key] = prefab;
            _pools[key] = new Queue<GameObject>();

            for (int i = 0; i < initialSize; i++)
            {
                var obj = Instantiate(prefab, transform);
                obj.SetActive(false);
                _pools[key].Enqueue(obj);
            }
        }

        public GameObject Get(string key)
        {
            if (!_pools.ContainsKey(key)) return null;

            GameObject obj;
            if (_pools[key].Count > 0)
            {
                obj = _pools[key].Dequeue();
            }
            else
            {
                obj = Instantiate(_prefabs[key], transform);
            }

            obj.SetActive(true);
            return obj;
        }

        public void Return(string key, GameObject obj)
        {
            if (!_pools.ContainsKey(key))
            {
                Destroy(obj);
                return;
            }

            obj.SetActive(false);
            obj.transform.SetParent(transform);
            _pools[key].Enqueue(obj);
        }

        public void ReturnDelayed(string key, GameObject obj, float delay)
        {
            StartCoroutine(ReturnAfterDelay(key, obj, delay));
        }

        private System.Collections.IEnumerator ReturnAfterDelay(string key, GameObject obj, float delay)
        {
            yield return new WaitForSeconds(delay);
            Return(key, obj);
        }
    }
}
