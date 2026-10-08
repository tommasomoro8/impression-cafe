using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;
using System;
using UnityEngine.InputSystem;
using System.Threading;
using System.Text;
using UnityEngine.Audio;
using SocketIOClient;
using SocketIOClient.Newtonsoft.Json;
using UnityEngine.UI;

[RequireComponent (typeof (AudioSource))]
public class ApiCallAndMovement : MonoBehaviour
{
    public GameObject player; // Object Player
    public InputActionProperty pinchAnimationAction; // controller con cui si attiva la registrazione


    public GameObject monet;
    public GameObject renoir;
    public GameObject manet;
    public GameObject degas;

    public Animator myAnimationController; // animator di cui cambio le variabili
    public Collider UIObject; // Il collider per capire la distanza

    // private readonly string filePath = "C:\\Users\\ivanl\\Desktop\\sukabliath\\Assets\\call.wav";

    public string domain = "http://localhost:3000"; // indirizzo del server, senza "/" finale

    private Dictionary<string, AuthorInfo> authorsInfo; // all authors names
    private int currentAuthorIndex = 0; // varibale that is needed to change author mid game
    private bool canSendAudio = false;

    private ServerCalls serverCalls; // stores all the api calls
    private string sessionId; // stores sessionId got from server
    private string writePermissionPassword;

    public SocketIOUnity socket; // socket io
    public List<string> playbackQueue; // queue of the audio received from socket io
    public AudioSource audioSource; // audioSource for the audio received from socket.io
    public bool isSpeaking = false; // prevents from playing 2 audio at the same time

    public class OutputAudioStream // 
    {
        public string status { get; set; }
        public string authorId { get; set; }
        public string binaryAudioData { get; set; }
        public int audioOrder { get; set; }
        public int timestamp { get; set; }
    }

    private bool micConnected = false; // microfono connesso
    private int minFreq; // frequenze stabilite dal codice
    private int maxFreq;

    private AudioSource goAudioSource; // prende l'audio source da Player
    private AudioSource playAssistantAudio; // per far partire l'audio del autore

    private bool isRecording = false;
    private AudioClip recordedClip;

    private KeyCode keyToPress = KeyCode.P; // push to talk
    private bool isKeyPressed = false;

    private int authorIsSpeaking = -1; // variable that stores the index of the author that is speaking

    const string PLAYER_WALKING = "Player_Walking";
    const string PLAYER_IDLE = "Player_Idle";
    const string PLAYER_TALKING = "Player_Talking";
    const string PLAYER_GREETING = "Player_Greeting";


    // Unity FUNCTIONS Start - Update - OnGUI - OnDestroy - OnTriggerEnter - OnTriggerLeave
    void Start()
    {
        if(Microphone.devices.Length <= 0)    
        { 
            Debug.LogWarning("Microphone not connected!");    
        }
        else  
        {   
            micConnected = true;    

            Microphone.GetDeviceCaps(null, out minFreq, out maxFreq);    
  
            if(minFreq == 0 && maxFreq == 0)    
            {
                maxFreq = 44100;    
            }    

            goAudioSource = this.GetComponent<AudioSource>();    
        }

        // Initialize the Dictionary with AuthorInfo instances
        authorsInfo = new Dictionary<string, AuthorInfo>
        {
            {"0", new AuthorInfo("Monet", 0, "chat-monet", PLAYER_IDLE, GameObject.Find("Monet"), GameObject.Find("Monet_Friend"))},
            {"1", new AuthorInfo("Renoir", 1,  "chat-renoir", PLAYER_IDLE, GameObject.Find("Renoir"), GameObject.Find("Renoir_Friend"))},
            {"2", new AuthorInfo("Manet", 2,  "chat-manet", PLAYER_IDLE, GameObject.Find("Manet"), GameObject.Find("Manet_Friend"))},
            {"3", new AuthorInfo("Degas", 3,  "chat-degas", PLAYER_IDLE, GameObject.Find("Degas"), GameObject.Find("Degas_Friend"))}
        };

        serverCalls = new ServerCalls();
        StartCoroutine(serverCalls.NewSessionInfo(domain + "/api/new-session", OnNewSessionSuccess, OnError));

        Debug.Log("End Start");
    }

    void Update()
    {
        if (canSendAudio){
            RotateTowardsTarget(authorsInfo[currentAuthorIndex.ToString()].gameObject);
            RotateTowardsTarget(authorsInfo[currentAuthorIndex.ToString()].authorFriend);
        }

        float triggerValue = pinchAnimationAction.action.ReadValue<float>();

        if (micConnected && canSendAudio)
        {
            if (triggerValue > 0.8)
            {
                if (!Microphone.IsRecording(null)) 
                {
                    StartCoroutine(StartRecording());
                }
                isKeyPressed = true;
            }
        }

        if (triggerValue < 0.8 && isKeyPressed)
        {
            isKeyPressed = false;
            StopRecording();
        }

        if (playbackQueue.Count > 0 && !isSpeaking) 
        {
            StartCoroutine(ConvertBase64ToAudioClip(playbackQueue[0]));
            playbackQueue.RemoveAt(0);
            // add fisnish talking here => check if playbackQueue changes state then when it comes back to 0 remove the animation
        }

        if(authorIsSpeaking != -1)
        {
            if (playbackQueue.Count == 0 && !isSpeaking && authorsInfo[authorIsSpeaking.ToString()].currentState == PLAYER_TALKING)
            {
                AuthorInfo authorInfo = authorsInfo[authorIsSpeaking.ToString()];
                authorIsSpeaking = -1;
                ChangeAnimationState(authorInfo.authorIndex.ToString(), authorInfo.currentState, PLAYER_IDLE, authorInfo.authorAnimatorController);
            }
        }
    }

    void OnGUI()
    {
        if(micConnected && canSendAudio)    
        {
            GUI.contentColor = Color.green;    
            GUI.Label(new Rect(50, 50, 200, 50), "Player entered the trigger zone");
        }
        else if (!canSendAudio)
        {
            GUI.contentColor = Color.red;    
            GUI.Label(new Rect(50, 50, 200, 50), "Player exited the trigger zone");
        }
        else
        {
            GUI.contentColor = Color.red;    
            GUI.Label(new Rect(Screen.width/2-100, Screen.height/2-25, 200, 50), "Microphone not connected!");
        }

        GUI.Label(new Rect(50, 80, 200, 50), isKeyPressed ? "Release " + keyToPress.ToString() + " to stop talking" : "Press " + keyToPress.ToString() + " to talk");
    }

    private void OnTriggerEnter(Collider collider)
    {
        if (collider.CompareTag("AuthorTriggerZone"))
        {
            // Perform actions specific to the trigger zone itself, if needed
            // For example, you could log a message indicating that the trigger zone was entered by something other than the player
            Debug.Log("Object with name '" + collider.gameObject.name + "' entered trigger zone.");

            if (!collider.gameObject.name.EndsWith("Collider")) return;

            foreach (var authorEntry in authorsInfo)
            {
                AuthorInfo authorInfo = authorEntry.Value;

                if (collider.gameObject.name.Substring(0, collider.gameObject.name.Length - 8) == authorInfo.authorName && authorInfo.authorIndex != currentAuthorIndex)
                {
                    canSendAudio = true;

                    ResetAnimationState(authorInfo.authorIndex);

                    ChangeAnimationState(authorInfo.authorIndex.ToString(), authorInfo.currentState, PLAYER_GREETING, authorInfo.authorAnimatorController);

                    currentAuthorIndex = authorInfo.authorIndex;

                    serverCalls.SetPOSTreq(domain + "/api/" + sessionId + "/new-chat/" + authorInfo.chatName);
                    Debug.Log("Current author: " + authorInfo.chatName + " Index: " + authorInfo.authorIndex);
                
                }
            }
        }
    }

    private void OnTriggerExit(Collider collider)
    {
        if (collider.CompareTag("AuthorTriggerZone"))
        {
            Debug.Log("Object with name '" + collider.gameObject.name + "' left the trigger zone.");

            currentAuthorIndex = -1; // CHECK THIS VARIABLE

            canSendAudio = false;

            foreach (var authorEntry in authorsInfo)
            {
                AuthorInfo authorInfo = authorEntry.Value;

                // Reset the rotation of the author and their friend to their initial rotations
                StartCoroutine(ResetRotations(authorInfo.gameObject.transform, authorInfo.authorInitialRotation, 0.5f));
                StartCoroutine(ResetRotations(authorInfo.authorFriend.transform, authorInfo.authorFriendInitialRotation, 0.5f));
            }

            ResetAnimationState(-1); // resets all animations
        }
    }

    // void OnDestroy()
    // {
    //     socket.Disconnect();
    // }


    // START RECORDING AND STOP RECORDING FUNCTIONS 
    IEnumerator StartRecording()
    {
        isRecording = true;

        authorIsSpeaking = currentAuthorIndex;

        recordedClip = Microphone.Start(null, true, 20, maxFreq);
        yield return null;

        while (isRecording)
        {
            // Continuously update the recorded audio clip
            recordedClip = AudioClip.Create("RecordedAudio", Microphone.GetPosition(null), recordedClip.channels, recordedClip.frequency, false);
            yield return null;
        }
    }

    void StopRecording()
    {
        isRecording = false;
        Microphone.End(null);

        SavWav.Save("call", recordedClip);
        StartCoroutine(serverCalls.SendAudio(Application.dataPath + "/call.wav", OnAudioSuccess, OnError));
    }


    // Fnctions called from API
    // Callback for success response NewSession
    private void OnNewSessionSuccess(string jsonResponse)
    {
        ApiReply apiReply = ApiReply.CreateFromJsonNewSession(jsonResponse);

        Debug.Log("Init Session ID: " + apiReply.sessionId);
        Debug.Log("Init Write Permission Password: " + apiReply.writePermissionPassword);

        sessionId = apiReply.sessionId;
        writePermissionPassword = apiReply.writePermissionPassword;

        serverCalls.SetApiPassword(writePermissionPassword);
        
        // serverCalls.SetPOSTreq(domain + "/api/" + sessionId + "/new-chat/" + authorsInfo[currentAuthorIndex.ToString()].chatName);

        SocketInit(sessionId);
    }

    // Callback for success response Audio
    private void OnAudioSuccess(string apiReply)
    {
        Debug.Log("Json received from audio " + apiReply);
    }

    // Callback for error response
    private void OnError(string errorMessage)
    {
        Debug.LogError("ApiCallAndMovement" + errorMessage);
    }


    // Function called to init Socket.io
    async private void SocketInit(string sessionId)
    {
        serverCalls.SetGETaudio(domain + "/audio/" + sessionId + "/");

        var uri = new Uri(domain + "/chat");

        var HttpHeaders = new Dictionary<string, string>
        {
            {"User-Agent", "Unity3D"}
        };

        var socketOptions = new SocketIOOptions
        {
            Query = new Dictionary<string, string>
            {
                {"sessionId", sessionId}
            },
            Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
        };
        socketOptions.ExtraHeaders = HttpHeaders;

        socket = new SocketIOUnity(uri, socketOptions);

        await socket.ConnectAsync();

        Debug.Log("socket.io connesso");

        Dictionary<int, string> audioDictionary = new Dictionary<int, string>();
        List<int> audioAlreadyInQueue = new List<int>();

        socket.On("chat-unity", (response) =>
        {
            var obj = response.GetValue<OutputAudioStream>();

            if (obj.status == "output-audio-stream") {
                audioDictionary[obj.audioOrder] = obj.binaryAudioData;

                int i = 0;
                while (true) {
                    try 
                    {
                        if (audioDictionary[i] == "");

                        if (!audioAlreadyInQueue.Contains(i)) {
                            playbackQueue.Add(audioDictionary[i]);
                            audioAlreadyInQueue.Add(obj.audioOrder);
                        }
                    }
                    catch (Exception e)
                    {
                        break;
                    }
                    i++;
                }
            }

            if (obj.status == "output-audio-stream-ended") {
                audioDictionary = new Dictionary<int, string>();
                audioAlreadyInQueue = new List<int>();
            }
        });

        socket.OnError += (sender, e) =>
        {
            Debug.Log("Socket Error: {e}");
            Debug.Log(e);
        };
    }

    IEnumerator ConvertBase64ToAudioClip(string base64EncodedMp3String)
    {
        audioSource = authorsInfo[authorIsSpeaking.ToString()].gameObject.GetComponent<AudioSource>(); // CAMBIA DA DOVE PARTE L'AUDIO PER L'ANIMAZIONE DELLA BOCCA

        if (authorsInfo[authorIsSpeaking.ToString()].currentState != PLAYER_TALKING) 
        {
            AuthorInfo authorInfo = authorsInfo[authorIsSpeaking.ToString()];
            ChangeAnimationState(authorInfo.authorIndex.ToString(), authorInfo.currentState, PLAYER_TALKING, authorInfo.authorAnimatorController);
        }

        isSpeaking = true;

        var audioBytes = Convert.FromBase64String(base64EncodedMp3String);
        var tempPath = "file://" + Application.persistentDataPath + "/doNotDelate.mp3";

        File.WriteAllBytes(Application.persistentDataPath + "/doNotDelate.mp3", audioBytes);
        UnityWebRequest request = UnityWebRequestMultimedia.GetAudioClip(tempPath, AudioType.MPEG);

        yield return request.SendWebRequest();

        if (request.result.Equals(UnityWebRequest.Result.ConnectionError))
        {
            Debug.LogError(request.error);

            File.Delete(Application.persistentDataPath + "/doNotDelate.mp3");
        }
        else
        {
            AudioClip clip = DownloadHandlerAudioClip.GetContent(request);
            
            audioSource.clip = clip;

            audioSource.Play();

            audioSource.loop = false;

            Debug.Log(clip.length + " Socket audio playing");

            File.Delete(Application.persistentDataPath + "/doNotDelate.mp3");

            yield return new WaitForSeconds(clip.length);
        }

        audioSource.clip = null;
        isSpeaking = false;
    }


    // Animation HANDLER
    void ResetAnimationState(int authorIndexToSkip)
    {
        foreach (var authorEntry in authorsInfo)
        {
            AuthorInfo authorInfo = authorEntry.Value;

            if (authorInfo.authorIndex != authorIndexToSkip) ChangeAnimationState(authorInfo.authorIndex.ToString(), authorInfo.currentState, PLAYER_IDLE, authorInfo.authorAnimatorController);
        }
    }

    void ChangeAnimationState(string key, string currentState, string newState, Animator animator)
    {
        if (authorsInfo[key].currentState == PLAYER_TALKING && key == authorIsSpeaking.ToString()) return;
        if (currentState == newState) return;

        animator.CrossFade(newState, 0.25f);

        authorsInfo[key].currentState = newState; // make it so that it changes the dict
    }

    void RotateTowardsTarget(GameObject characterGameObject)
    {
        Vector3 targetPosition = transform.position;

        if (characterGameObject == null) return;

        // Get the direction towards the target ignoring the y-axis
        Vector3 direction = targetPosition - characterGameObject.transform.position;
        direction.y = 0f;

        // Calculate the rotation to look at the target only around the y-axis
        Quaternion targetRotation = Quaternion.LookRotation(direction);

        // Smoothly rotate towards the target over time
        characterGameObject.transform.rotation = Quaternion.Slerp(characterGameObject.transform.rotation, targetRotation, Time.deltaTime * 5f);
    }

    IEnumerator ResetRotations(Transform transformToRotate, Quaternion targetRotation, float duration)
    {
        Quaternion initialRotation = transformToRotate.rotation;
        float timeElapsed = 0f;

        while (timeElapsed < duration)
        {
            // Interpolate between the initial rotation and the target rotation
            float t = timeElapsed / duration;
            transformToRotate.rotation = Quaternion.Slerp(initialRotation, targetRotation, t);

            // Increment time elapsed
            timeElapsed += Time.deltaTime;

            yield return null; // Wait for the next frame
        }

        // Ensure the rotation reaches the exact target rotation
        transformToRotate.rotation = targetRotation;
    }
}