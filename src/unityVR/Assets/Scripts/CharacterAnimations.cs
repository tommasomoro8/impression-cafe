using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CharacterAnimations : MonoBehaviour
{
    public bool IsWomen = false;

    private bool AnimatorPresent = true;

    const string SITTING_IDLE = "Sitting_Idle";
    const string SITTING_DISAPROVAL = "Sitting_Disaproval";
    const string SITTING_DISBELIEF = "Sitting_Disbelief";
    const string SITTING_TALKING_FEMALE = "Sitting_Talking_Female";
    const string SITTING_TALKING_MALE = "Sitting_Talking_Male";

    private Animator animator; // Reference to the Animator component
    private AudioSource audioSource; // Reference to the AudioSource component
    private string[] availableAnimations; // Array to store available animations
    private string lastAnimation; // Store the last animation played
    private float lastAnimationChangeTime; // Store the time of the last animation change


    // Start is called before the first frame update
    void Start()
    {
        // Get the Animator component attached to this GameObject
        animator = GetComponent<Animator>();
        audioSource = GetComponent<AudioSource>();

        // Check if there is no Animator component
        if (animator == null)
        {
            AnimatorPresent = false;
            Debug.LogError("No Animator component found on " + gameObject.name);
        }

        if (AnimatorPresent)
        {
            AnimationClip[] animationClips = animator.runtimeAnimatorController.animationClips;
            foreach (AnimationClip clip in animationClips)
            {
                AnimationEvent animationEvent = new AnimationEvent();
                animationEvent.time = clip.length - 0.01f; // Set event just before the end of animation
                animationEvent.functionName = "OnAnimationEnd"; // Function to call when the event triggers
                clip.AddEvent(animationEvent); // Add the event to each animation clip
            }
        }

        // Initialize the array of available animations
        if (IsWomen)
        {
            availableAnimations = new string[] { SITTING_IDLE, SITTING_TALKING_FEMALE, SITTING_TALKING_MALE };
        }
        else
        {
            availableAnimations = new string[] { SITTING_IDLE, SITTING_TALKING_FEMALE, SITTING_TALKING_MALE };
        }

        // Initialize the last animation change time
        lastAnimationChangeTime = Time.time;
    }

    // Update is called once per frame
    void Update()
    {
        if (!AnimatorPresent) return;

        // Check if it's time to change the animation
        if (Time.time - lastAnimationChangeTime >= 10f)
        {
            if (audioSource != null && audioSource.isPlaying)
            {
                audioSource.Stop();
            }

            // Select a random animation from available animations excluding the last one
            string newAnimation = GetRandomAnimation();

            // Play the selected animation
            animator.CrossFade(newAnimation, 0.25f);

            // Check if the new animation includes "talking"
            if (newAnimation.Contains("Talking"))
            {
                // Get the AudioSource component attached to this GameObject
                AudioSource audioSource = GetComponent<AudioSource>();

                // Check if there is an AudioSource component
                if (audioSource != null)
                {
                    // Play the audio clip attached to the AudioSource component
                    audioSource.Play();
                    audioSource.loop = false;
                }
                // else
                // {
                //     Debug.LogError("No AudioSource component found on " + gameObject.name);
                // }
            }

            // Update the last animation and last animation change time
            lastAnimation = newAnimation;
            lastAnimationChangeTime = Time.time;
        }
    }

    void OnAnimationEnd()
    {
        if (audioSource != null && audioSource.isPlaying)
        {
            audioSource.Stop();
        }

        // Select a new animation and play it
        string newAnimation = GetRandomAnimation();
        animator.CrossFade(newAnimation, 0.25f);
        lastAnimation = newAnimation;

        // Check if the new animation includes "talking"
        if (newAnimation.Contains("Talking"))
        {
            // Get the AudioSource component attached to this GameObject
            AudioSource audioSource = GetComponent<AudioSource>();

            // Check if there is an AudioSource component
            if (audioSource != null)
            {
                // Play the audio clip attached to the AudioSource component
                audioSource.Play();
                audioSource.loop = false;
            }
            // else
            // {
            //     Debug.LogError("No AudioSource component found on " + gameObject.name);
            // }
        }

        // Update the last animation change time
        lastAnimationChangeTime = Time.time;
    }

    // Function to get a random animation from available animations
    private string GetRandomAnimation()
    {
        string newAnimation = lastAnimation;

        // Keep selecting a new animation until it's different from the last one
        while (newAnimation == lastAnimation)
        {
            newAnimation = availableAnimations[Random.Range(0, availableAnimations.Length)];
        }

        return newAnimation;
    }
}