import { useEffect, useState } from 'react'
import './App.css'
import { AiFillDelete } from 'react-icons/ai';  // import the delete icon
import { FaFileUpload } from 'react-icons/fa';  // import the delete icon
import Placeholder from './assets/placeholder.jpeg'  // import the placeholder image
import Loading from './components/Loading.jsx';  // import the loading component
import { BlobServiceClient } from '@azure/storage-blob';
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

const App = () => {
  const [file, setFile] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userID, setUserId] = useState('');
  const [userName, setUserName] = useState('')
  const [events, setEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    eventName: '',
    eventType: '',
    dateOfEvent: '',
    location: '',
    uploadedBy: ''
  });
  const [editingEventId, setEditingEventId] = useState(null);

  //Storage account credentials
  const account = import.meta.env.VITE_STORAGE_ACCOUNT  // get the storage account name from the .env file
  const sasToken = import.meta.env.VITE_STORAGE_SAS  // get the SAS token from the .env file
  const containerName = import.meta.env.VITE_STORAGE_CONTAINER  // get the container name from the .env file
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sasToken}`);  // create a blobServiceClient
  const containerClient = blobServiceClient.getContainerClient(containerName);  // create a containerClient

  // Set up Application Insights
  useEffect(() => {
    const instrumentationKey = import.meta.env.VITE_APPINSIGHTS_INSTRUMENTATION_KEY;  // get the instrumentation key from the .env file
    const appInsights = new ApplicationInsights({
      config: {
        instrumentationKey: instrumentationKey, // Replace with your Instrumentation Key
      },
    });

    appInsights.loadAppInsights();

    // Track page view (just to verify if it works)
    appInsights.trackPageView();

    // Cleanup function to unload Application Insights when the component is unmounted
    return () => {
      appInsights.unload();
    };
  }, []);

  //fetch all images
  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://prod-18.uksouth.logic.azure.com:443/workflows/67a85c32f6bf4778b7b32df72d2019f5/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=SeTaaadVHukIK7ZZPI0LIoc6liq3Usq-_zDZhjENbg0');
      const metadata = await response.json();
      const urls = metadata.map(item => {
        const url = `https://eventhighlightblob.blob.core.windows.net${item.filePath}`;
        return {
          name: item.fileName,
          url: url,
          id: item.id,
          filePath: item.filePath,
          userName: item.userName
        };
      });
      setImageUrls(urls);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  //save an Image
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {  // check if the file is selected
      alert('Please select an image to upload');
      return;
    }
    if (!account || !sasToken || !containerName) {
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('FileName', file.name);
      formData.append('userID', userID); // Replace with actual userID
      formData.append('userName', userName); // Replace with actual userName
      formData.append('file', file);

      const response = await fetch('https://prod-31.uksouth.logic.azure.com:443/workflows/dc11d3a941b7474e9a4541919d17506d/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=MtFnwsJWsFcyrIDaF12FOXTEeMhzBih2vQBN5fRQcwE', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await fetchImages();
      } else {
        console.error('Error uploading file:', response.statusText);
      }
    } catch (error) {
      console.error('Error uploading file:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // delete an Image
  const handleDelete = async (blobItem) => {
    if (!account || !sasToken || !containerName) {
      alert('Please make sure you have set the Azure Storage credentials in the .env file');
      return;
    }
    try {
      setLoading(true);
      const deleteUrl = 'https://prod-29.uksouth.logic.azure.com:443/workflows/06443720c10743a093dfed6886a1a4bb/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=24f2Iw_PPQEDeDiRWSuQj2Bca6VlirA325dj1O_hBqI';

      const formData = new FormData();
      formData.append('blobLocator', blobItem.filePath);
      formData.append('documentID', blobItem.id);

      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await fetchImages();
      } else {
        console.error('Error deleting file:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting file:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://prod-20.uksouth.logic.azure.com/workflows/d3e3abbbb71f4e41a20046ff165342dc/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=vU0y6_JSoc0_otYkC8oX1NJpjiBKgajtySp6uQ7FSSs');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async () => {
    const url = editingEventId
        ? `https://prod-25.uksouth.logic.azure.com/workflows/6bbe880f21ae4503ba75e6a01c2b64a3/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events/${editingEventId}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=6o7dFpnQjTJE1Zfr7MzXp0LmUPKUGUZWArSKlz_gJRM`
        : 'https://prod-20.uksouth.logic.azure.com/workflows/a14bdd1adb754ebbad08096fc68821e4/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=bD1c_q9tT_PwTONySMHvxFd6hWiXr6u2MBYxnZ-F-bA';

    const method = editingEventId ? 'PUT' : 'POST';

    setLoading(true);
    try {
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventForm)
      });
      await fetchEvents();
      setEventForm({
        eventName: '',
        eventType: '',
        dateOfEvent: '',
        location: '',
        uploadedBy: ''
      });
      setEditingEventId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventEdit = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`https://prod-30.uksouth.logic.azure.com/workflows/f7fa00604316413b98b6184c8abb5f6c/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events/${id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=HqlysZZ_VccWSKZ7NputVl64f2XhaN9S-UTMoDzeHnE`);
      const data = await response.json();
      setEventForm({
        eventName: data.eventName,
        eventType: data.eventType,
        dateOfEvent: data.dateOfEvent,
        location: data.location,
        uploadedBy: data.uploadedBy
      });
      setEditingEventId(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventDelete = async (id) => {
    setLoading(true);
    try {
      await fetch(`https://prod-28.uksouth.logic.azure.com/workflows/b2fdc108ceb7490a916aeeaf3ad3a4ef/triggers/When_a_HTTP_request_is_received/paths/invoke/rest/v1/events/${id}?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=4Vyh_iLk4e_gZ4BB5IaY_ChgEDQKok4z_X84AuDTekg`, {
        method: 'DELETE'
      });
      await fetchEvents();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // fetch all images when the page loads
  useEffect(() => {
    fetchImages();
    fetchEvents();
  }, [])

  // Helper function to get the image name without extension
  const getImageNameWithoutExtension = (filename) => {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
  };

  return (
    <div className="container">
      {loading && <Loading />}
      <h2>📸 Event Highlight Media Service 📸</h2><hr />
      <div className="row-form">
        <form className='upload-form'>
          <div className='upload-form_inputs'>
            <input type="text" placeholder="User ID" value={userID} onChange={(e) => setUserId(e.target.value)} />
            <input type="text" placeholder="User Name" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div className='upload-form_display'>
            {
              file ? <img className="displayImg" src={URL.createObjectURL(file)} alt="no pic" />
                : <img className="displayImg" src={Placeholder} alt="nopic" />
            }
          </div>
          <div className='upload-form_inputs'>
            <label htmlFor="fileInput"><FaFileUpload /></label>
            <input type="file" style={{ display: "none" }} id="fileInput" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit" onClick={handleSubmit} >Upload</button>
          </div>
        </form>
      </div>
      <div className="row-display">
        {imageUrls.length === 0 ? <h3>😐 No Images Found😐 </h3> : (
          imageUrls && imageUrls.map((blobItem, index) => {
            return (
              <div key={index} className="card">
                <img src={blobItem.url} alt="no pic" />
                <h3 style={{ width: "90%" }}>{getImageNameWithoutExtension(blobItem.name)}</h3>
                <h3 style={{ width: "90%" }}>Uploaded by: {blobItem.userName}</h3>
                <button className="del" onClick={() => handleDelete(blobItem)} > <AiFillDelete /> </button>
              </div>
            )
          })
        )}
      </div>
      <h2>Event Tracker</h2>
      <div className="row-form">
        <form className='event-form'>
          <div className='event-form_inputs'>
            <input type="text" placeholder="Event Name" value={eventForm.eventName} onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })} />
            <input type="text" placeholder="Event Type" value={eventForm.eventType} onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })} />
            <input type="text" placeholder="Date of Event" value={eventForm.dateOfEvent} onChange={(e) => setEventForm({ ...eventForm, dateOfEvent: e.target.value })} />
            <input type="text" placeholder="Location" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
            <input type="text" placeholder="Uploaded By" value={eventForm.uploadedBy} onChange={(e) => setEventForm({ ...eventForm, uploadedBy: e.target.value })} />
            <button type="button" onClick={handleEventSubmit}>{editingEventId ? 'Update Event' : 'Add Event'}</button>
          </div>
        </form>
      </div>
      <div className="row-display">
        {events.length === 0 ? <h3>😐 No Events Found😐 </h3> : (
            events.map((event, index) => (
                <div key={index} className="card">
                  <h3>{event.eventName}</h3>
                  <p>{event.eventType}</p>
                  <p>{event.dateOfEvent}</p>
                  <p>{event.location}</p>
                  <p>{event.uploadedBy}</p>
                  <button className="edit" onClick={() => handleEventEdit(event.eventID)}>Edit</button>
                  <button className="del" onClick={() => handleEventDelete(event.eventID)}>Delete</button>
                </div>
            ))
        )}
      </div>
    </div>
  )
}

export default App
