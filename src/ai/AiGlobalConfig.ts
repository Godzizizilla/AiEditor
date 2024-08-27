import {AiModelConfig} from "./core/AiModelConfig.ts";
import {AiModelFactory} from "./AiModelFactory.ts";
import {AIBubbleMenuItem} from "../components/bubbles/types.ts";

export interface AiMenu {
    icon: string,
    name: string,
    prompt?: string,
    text?: "selected" | "focusBefore",
    model?: string,
    children?: AiMenu[],
}


export interface AiGlobalConfig {
    models: Record<string, AiModelConfig>,
    modelFactory?: AiModelFactory,
    onTokenConsume?: (modelName: string, modelConfig: AiModelConfig, count: number) => void,
    onCreateClientUrl?: (modelName: string, modelConfig: AiModelConfig, onSuccess: (url: string) => void, onFailure: () => void) => void,
    onBubbleMenuError?: (e: Error) => void,
    bubblePanelEnable?: boolean,
    bubblePanelModel?: string,
    bubblePanelMenus?: AIBubbleMenuItem[],
    menus?: AiMenu[],
    commands?: AiMenu[],
    codeBlock?: {
        codeComments?: {
            model: string,
            prompt: string,
        },
        codeExplain?: {
            model: string,
            prompt: string,
        }
    }
}
