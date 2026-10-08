using UnityEngine;

[System.Serializable]
public class AuthorInfo
{
    public string authorName;
    public int authorIndex;
    public string chatName;
    public string currentState;
    public bool follow;
    public GameObject authorFriend;
    public Quaternion authorFriendInitialRotation;
    public GameObject gameObject;
    public Quaternion authorInitialRotation;
    public Animator authorAnimatorController;
    public Collider authorColliderObject;

    public AuthorInfo(string authorName, int authorIndex, string chatName, string currentState, GameObject characterGameObject, GameObject authorFriend)
    {
        this.authorName = authorName;
        this.chatName = chatName;
        this.authorIndex = authorIndex;
        this.currentState = currentState;
        this.follow = false;
        this.gameObject = characterGameObject;
        this.authorInitialRotation = characterGameObject.transform.rotation;
        this.authorFriend = authorFriend;
        this.authorFriendInitialRotation = authorFriend.transform.rotation;
        this.authorAnimatorController = GetAnimatorForCharacter(characterGameObject);
        this.authorColliderObject = GetColliderForCharacter(characterGameObject);
    }

    Animator GetAnimatorForCharacter(GameObject characterGameObject)
    {
        Animator animator = characterGameObject.GetComponent<Animator>();

        if (animator == null)
        {
            Debug.LogError("Animator not found on the character GameObject.");
        }

        return animator;
    }

    Collider GetColliderForCharacter(GameObject characterGameObject)
    {
        Collider characterCollider = characterGameObject.GetComponent<Collider>();

        if (characterCollider == null)
        {
            Debug.LogError("Collider not found on the character GameObject.");
        }

        return characterCollider;
    }
}