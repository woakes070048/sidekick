import {
    Avatar,
    Button,
    Spinner
  } from "flowbite-react";
  import ModalHeader, { withModalHeaderProps } from "../ModalHeader";

  import {
    HiLockClosed,
    HiEyeSlash
  } from "react-icons/hi2";
  import React from "react";
  import { useState, useEffect, useRef, useCallback} from "react";
  import { useModalContext } from "../../context/ModalContext";
  import SuccessIcon from "../icons/SuccessIcon";
import ErrorIcon from "../icons/ErrorIcon";
import { start } from "repl";

type Metadata = {
  [key: string]: string | null;
};
  
const NotionAuthFlow: React.FC = () => {

  const {
    authCode,
    setAuthCode,
    currentStep,
    setCurrentStep,
    selectedConnectorId,
    connectorName,
    customerLogoUrl,
    connectionId,
    publicKey,
    metadata,
    setMetadata,
    setIsLoading,
    isSuccess,
    setIsSuccess,
    isLoading,
    setError,
    authorizeConnection,
    setNewConnection
  } = useModalContext()
  const authCodeHandled = useRef(false)

  const renderResult = () => {
    if (isSuccess) {
      return (
        <div className="flex flex-col mb-4 space-y-4 items-center text-center">
          <SuccessIcon />
          <p className="text-gray-600">You have successfully connected to <span className="font-bold">{connectorName}</span>.</p>
        </div>
      )
    }

  return (
    <div className="flex flex-col mb-4 space-y-4 items-center text-center">
      <ErrorIcon />
      <div>
        <p className="text-gray-600">We couldn't connect to <span className="font-bold">{connectorName}</span>.</p>
        <p className="mt-1 text-sm text-gray-600">Try it one more time? If it still doesn’t work, contact Psychic.dev support <a href="mailto:support@getsidekick.ai" className="underline text-blue-500 hover:text-blue-600">here</a> and we’ll fix it.</p>
      </div>
    </div>
  )
  }

  const renderModalHeader = () => {
    return (
      <ModalHeader customerLogoUrl={customerLogoUrl} currentStep={currentStep} setCurrentStep={setCurrentStep}/>
    )
  }

  const renderModalBody = () => {
    return (
      <div className="space-y-6 px-8">
        {isLoading ? <div className="text-center">
          <div className="text-center">
            {isLoading ? <Spinner size="xl"/> : renderResult()}
          </div>
          <p className="mt-6">Authenticating with <span className="font-bold">{connectorName}</span>...</p>
        </div> : 
        renderResult()}
      </div>
    )
  }

  const renderModalFooter = () => {
    return (
      <div className="flex flex-col space-y-6 px-8 items-center">
        {isSuccess && !isLoading &&
          <Button size="xl" className="w-3/5 min-w-300" onClick={() => window.close()}>
            Finish
          </Button>
        }
        {!isSuccess && !isLoading &&
          <Button color="gray" size="xl" className="w-3/5 min-w-300" onClick={() => setCurrentStep(1)}>
            Go Back
          </Button>
        }
      </div>
    )
  }

  async function completeAuthWithCode(connectorId: string, authCode: string, metadata?: any) {
    if (!connectionId || !publicKey) {
      setError('Invalid connection_id or public_key')
      setIsLoading(false)
      return
    }
    const result = await authorizeConnection(
        connectorId, 
        connectionId, 
        publicKey,
        authCode,
        metadata
    )
    if (!result) {
      setError('Something went wrong. Please try again.')
      setIsSuccess(false)
      setIsLoading(false)
      return
    }
    setNewConnection(result.connection.connection_id)
    setIsSuccess(true)
    setIsLoading(false)
    // Notify opening window that auth is complete
    if (window.opener) {
      window.opener.postMessage({ connection_id: result.connection.connection_id }, '*')
    }
  }

  const handleMessage = useCallback((event: MessageEvent) => {
    // check if oigin is not http://localhost:5173 or link.psychic.dev
    if (event.origin !== "http://localhost:3000" && event.origin !== "https://link.psychic.dev") {
      return;
    }
    const data = event.data;
    if (data && data.code && !authCodeHandled.current) {
      authCodeHandled.current = true
      setAuthCode(data.code)
      
    }
  }, [selectedConnectorId])

  useEffect(() => {
    // Add event listeners to get auth codes
    window.addEventListener('message', handleMessage, false);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [selectedConnectorId]);

  useEffect(() => {
    if (authCode) {
        completeAuthWithCode(selectedConnectorId, authCode)
    }
  }, [authCode])

  return (
    <div>
      {renderModalHeader()}
      {renderModalBody()}
      {renderModalFooter()}
    </div>
  );
}

export default NotionAuthFlow;


  