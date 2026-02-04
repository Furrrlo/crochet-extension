declare global {
    interface Window {
        /**
         * The documentPictureInPicture read-only property of the Window interface returns a reference to the
         * DocumentPictureInPicture object for the current document context.
         *
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Window/documentPictureInPicture)
         */
        documentPictureInPicture?: DocumentPictureInPicture
    }

    /**
     * The DocumentPictureInPicture interface of the Document Picture-in-Picture API is the entry point for creating
     * and handling document picture-in-picture windows.
     *
     * It is accessed via the Window.documentPictureInPicture property.
     *
     * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/DocumentPictureInPicture)
     */
    interface DocumentPictureInPicture extends EventTarget {
        /**
         * The window read-only property of the DocumentPictureInPicture interface returns a Window instance
         * representing the browsing context inside the Picture-in-Picture window.
         *
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/DocumentPictureInPicture/window)
         */
        readonly window: Window;

        /**
         * The requestWindow() method of the DocumentPictureInPicture interface opens the Picture-in-Picture window
         * for the current main browsing context. It returns a Promise that fulfills with a Window instance
         * representing the browsing context inside the Picture-in-Picture window.
         *
         * The requestWindow() method requires transient activation, i.e., it must be invoked in response to a user
         * action such as a mouse click or button press.
         *
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/DocumentPictureInPicture/requestWindow)
         */
        requestWindow(options?: {
            disallowReturnToOpener?: boolean,
            height?: number,
            width?: number,
            preferInitialWindowPlacement?: boolean,
        }): Promise<Window>
    }
}
