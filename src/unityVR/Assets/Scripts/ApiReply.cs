using UnityEngine;

public class ApiReply
{
    // Fields for the "Init" response
    public string status;
    public string sessionId;
    public string writePermissionPassword;

    public static ApiReply CreateFromJsonNewSession(string jsonString)
    {
        return JsonUtility.FromJson<ApiReply>(jsonString);
    }

    // Fields for the "Audio" response
    public string audioStatus;
    public string audioId;
    public string audioTranscription;
    public string assistantAudioId;
    public string audioResponse;

    public static ApiReply CreateFromJsonAudio(string jsonString)
    {
        return JsonUtility.FromJson<ApiReply>(jsonString);
    }
}