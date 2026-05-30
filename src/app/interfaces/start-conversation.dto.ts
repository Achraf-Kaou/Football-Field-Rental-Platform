export interface StartConversationDto {
    currentUserId: number;
    targetUserId: number;
    initialMessage?: string;
}