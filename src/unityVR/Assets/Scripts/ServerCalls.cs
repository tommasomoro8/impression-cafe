using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;

public class ServerCalls
{
    private string apiPassword;
    private string POSTreq;
    private string GETaudio;

    public ServerCalls(string apiPassword = "", string POSTreq = "", string GETaudio = "")
    {
        this.apiPassword = apiPassword;
        this.POSTreq = POSTreq;
        this.GETaudio = GETaudio;
    }

    public void SetApiPassword(string newPassword)
    {
        apiPassword = newPassword;
    }

    public void SetPOSTreq(string newPOSTreq)
    {
        POSTreq = newPOSTreq;
    }

    public void SetGETaudio(string newGETaudio)
    {
        GETaudio = newGETaudio;
    }

    public IEnumerator NewSessionInfo(string url, Action<string> onSuccess, Action<string> onError)
    {
        UnityWebRequest www = UnityWebRequest.PostWwwForm(url, "");

        yield return www.SendWebRequest();

        if (www.isNetworkError || www.isHttpError)
        {
            string errorMessage = "API Request Error on NewSessionInfo " + www.error;
            Debug.LogError(errorMessage);
            onError?.Invoke(errorMessage);
        }
        else
        {
            string response = www.downloadHandler.text;
            Debug.Log("API Response: " + response);
            onSuccess?.Invoke(response);
        }
    }

    // Reusable function to send audio
    public IEnumerator SendAudio(string filePath, Action<string> onSuccess, Action<string> onError)
    {
        if (string.IsNullOrEmpty(apiPassword) || string.IsNullOrEmpty(POSTreq))
        {
            string errorMessage = "Shit went wrong! API Password or POST request is empty. NewSession didn't go as expected.";
            Debug.LogError(errorMessage);
            onError?.Invoke(errorMessage);
            yield break;
        }

        byte[] fileBytes = File.ReadAllBytes(filePath);

        WWWForm form = new WWWForm();
        form.AddBinaryData("audio", fileBytes, "call.wav", "audio/wav");

        UnityWebRequest www = UnityWebRequest.Post(POSTreq, form);

        www.SetRequestHeader("writepermissionpassword", apiPassword);

        yield return www.SendWebRequest();

        if (www.isNetworkError || www.isHttpError)
        {
            string errorMessage = "API Request Error on sendAudio: " + www.error;
            Debug.LogError(errorMessage);
            onError?.Invoke(errorMessage);
        }
        else
        {
            // Successful response
            string responseJson = www.downloadHandler.text;
            Debug.Log("API Response: " + responseJson);
            onSuccess?.Invoke(responseJson);
        }
    }

    public IEnumerator getAudio(string assistantID, Action<AudioClip> onSuccess, Action<string> onError)
    {
        if (string.IsNullOrEmpty(apiPassword) || string.IsNullOrEmpty(POSTreq))
        {
            string errorMessage = "Shit went wrong! API Password or POST request is empty. NewSession didn't go as expected.";
            Debug.LogError(errorMessage);
            onError?.Invoke(errorMessage);
            yield break;
        }

        string fullLink = GETaudio + assistantID;

        using UnityWebRequest www = UnityWebRequestMultimedia.GetAudioClip(fullLink, AudioType.UNKNOWN);

        yield return www.SendWebRequest();

        if (www.isNetworkError || www.isHttpError)
        {
            string errorMessage = "API Request Error on get assistant id: " + www.error;
            Debug.LogError(errorMessage);
            onError?.Invoke(errorMessage);
        }
        else
        {
            // Successful response
            AudioClip assistantAudio = DownloadHandlerAudioClip.GetContent(www);
            Debug.Log("Get assistant audio positive!");
            onSuccess?.Invoke(assistantAudio);
        }
    }
}