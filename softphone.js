
import React, {useState,useRef} from 'react';
import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { TelnyxRTC } from '@telnyx/webrtc';
import { useArray, useSetState } from 'react-hanger/array';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
}));


function App() {
    const classes = useStyles();
    const clientRef = useRef();
    const [call, setCall] = useState();
    const audioRef = useRef();
    const [registered, setRegistered] = useState();
    const [log, logActions] = useArray([]);
    const [callState, setCallState] = useSetState({
        call: null,
        status: null,
        mute: false,
        hold: false,
        error: null,
    });
    const [mobileNumber, setMobileNumber] = useState("000000000");


    const connectWebRTC = async () => {

        const configsTelnyxRTC = {
            login: "xyz",
            password: "xyz",
        };

        try {
            const telnyxWebRTCClient = new TelnyxRTC(configsTelnyxRTC);

            telnyxWebRTCClient.on('telnyx.ready', () => {
                logActions.push('registered');
                setRegistered(true);
            });

            telnyxWebRTCClient.on('telnyx.error', (error) => {
                console.error(error.message);
            });

            telnyxWebRTCClient.on('telnyx.socket.close', (close) => {
                logActions.push('unregistered');
                setRegistered(false);
                telnyxWebRTCClient.disconnect();
            });

            telnyxWebRTCClient.on('telnyx.notification', (notification) => {
                if (notification.call) {
                    notification.call = TelnyxRTC.telnyxStateCall(notification.call);
                    setCallState({
                        call: notification.call,
                    });
                }

                switch (notification.type) {
                    case 'callUpdate':

                        logActions.push(`Call Status::::: ${notification.call.state}`);

                        if (notification.call && notification.call.sipReason) {
                            let status = notification.call.state;
                            let sipReason = notification.call.sipReason;
                            let sipCallId = notification.call.sipCallId;

                            logActions.push(`Sip CallId: ${sipCallId}`);
                            logActions.push(`Call State: ${status} ${`(${sipReason})`}`);
                        } else {
                            logActions.push(
                                `Call State: ${notification.call.state}${
                                    notification.call.cause ? ` (${notification.call.cause})` : ''
                                }`
                            );
                        }

                        if (notification.call.state === 'done') {
                            setCallState({
                                status: notification.call.state,
                                call: null,
                            });
                        }

                        if (notification.call.state === 'active') {

                            setCallState({
                                call: notification.call,
                                status: notification.call.state,
                            });
                        }

                        if (notification.call.state === 'ringing') {
                            setCallState({
                                call: notification.call,
                                status: notification.call.state,
                            });
                        }
                        break;
                    default:
                        break;
                }
            });

            clientRef.current = telnyxWebRTCClient;
            clientRef.current.connect();

        } catch (error) {
            console.log('Authentication error', error.message);
        }
    };

    const startCall = () => {
        // You can save this call or wait for `callUpdate` and use the returned `activeCall`
        const newCall = clientRef.current.newCall({
            // Destination is required and can be a phone number or SIP URI
            destinationNumber: mobileNumber,
            callerName: '',
            // Caller ID number is optional.
            // You can only specify a phone number that you own and have assigned
            // to your Connection in the Telnyx Portal
            callerNumber: '447537173483‬',
            audio: true,
            video: false,
        });
        setCall(newCall);
        setCallState({
            call: newCall.call,
            error: null,
            mute: false,
            hold: false,
        });

    };

    if (
        audioRef.current &&
        callState.call &&
        callState.call.remoteStream
    ) {
        audioRef.current.srcObject = callState.call.remoteStream;
    }

    const clickToConnect = () => {
        connectWebRTC();
    };

    const clickToCallStart = () => {
        startCall();
    };

    const clickToCallEnd = () => {
        //client.disconnect().then(r => console.log("disconnect"));
        call.hangup();
    };

    const clickToDisconnect = () => {
        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
            setRegistered(false);
        }
    };

    const handleChange = (event) => {
        setMobileNumber(event.target.value);
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className={classes.root}>
                    <audio
                        ref={audioRef}
                        id='audioCall'
                        autoPlay='autoplay'
                        controls={false}
                    />

                    <div className={classes.root}>
                        <TextField id="standard-basic" label="Mobile Number" value={mobileNumber} onChange={handleChange}/>
                    </div>
                    <div className={classes.root}>
                        <Button onClick={() => clickToConnect()} variant="contained">Connect</Button>
                        <Button onClick={() => clickToCallStart()} variant="contained" color="primary">
                            Call
                        </Button>
                        <Button  onClick={() => clickToCallEnd()} variant="contained" color="secondary">
                            Call End
                        </Button>
                        <Button  onClick={() => clickToDisconnect()} variant="contained" color="secondary">
                            Disconnect
                        </Button>
                    </div>

                    <div>
                <pre data-testid='log-webrtc' className='LogHistory'>
                        {[...log].reverse().map((x, i) => (
                            <div data-testid='log-webrtc-children' key={i}>
                                {x}
                            </div>
                        ))}
                      </pre>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default App;
