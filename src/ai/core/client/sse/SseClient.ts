import {AiClientListener} from "../../AiClientListener.ts";
import {AiClient} from "../../AiClient.ts";

type SSEConfig = { url: string, method: string, headers?: Record<string, any> }

export class SseClient implements AiClient {
    isStop: boolean = false
    config: SSEConfig;
    fetch?: Response;
    isOpen: boolean = false;
    payload?: string;
    listener: AiClientListener;
    ctrl = new AbortController();

    constructor(config: SSEConfig, listener: AiClientListener) {
        this.config = config;
        this.listener = listener;
    }


    start(payload: string) {
        this.payload = payload;
        this.onOpen()
        this.listener.onStart(this);
    }

    stop() {
        if (this.fetch) {
            // 取消请求
            this.ctrl.abort();

            if (!this.isStop) {
                this.listener.onStop();
                this.isStop = true;
            }
        }
    }

    async send(payload: string) {
        if (this.isOpen) {
            try {
                const response = await fetch(this.config.url,
                    {
                        method: this.config.method || "POST",
                        headers: this.config.headers,
                        body: payload
                    }
                );
                if (!response.ok) {
                    this.onError();
                    return
                }
                const reader = response.body?.getReader();
                if (!reader) {
                    this.onError();
                    return
                }
                const decoder = new TextDecoder("utf-8");
                let buffer = '';

                while (true) {
                    let {value, done} = await reader.read();
                    if (done) {
                        this.onClose();
                        break;
                    }
                    let responseText = decoder.decode(value);
                    if (!responseText) {
                        continue;
                    }
                    
                    buffer += responseText;
                    let messages = buffer.split("\n\n");
                    buffer = messages.pop() || '';

                    for (let message of messages) {
                        let fullMessage = '';
                        let lines = message.split('\n');
                        for (let line of lines) {
                            if (line.startsWith('data:')) {
                                let data = line.slice(5).trim();
                                if (data) {
                                    fullMessage += data + '\n';
                                }
                            }
                        }
                        if (fullMessage) {
                            this.onMessage(fullMessage.trim());
                        }
                    }
                }

                if (buffer) {
                    let fullMessage = '';
                    let lines = buffer.split('\n');
                    for (let line of lines) {
                        if (line.startsWith('data:')) {
                            let data = line.slice(5).trim();
                            if (data) {
                                fullMessage += data + '\n';
                            }
                        }
                    }
                    if (fullMessage) {
                        this.onMessage(fullMessage);
                    }
                }
            } catch {
                this.onError()
            }
        }
    }

    protected onOpen() {
        this.isOpen = true;
        this.send(this.payload!);
    }

    protected onMessage(answer: string) {
        this.listener.onMessage(answer)
    }

    protected onClose() {
        this.isOpen = false;
        if (!this.isStop) {
            this.listener.onStop();
            this.isStop = true;
        }
    }

    protected onError() {
        this.isOpen = false;
        if (!this.isStop) {
            this.listener.onStop();
            this.isStop = true;
        }
    }
}