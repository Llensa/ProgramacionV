/** Documento de estadisticas publicas en `games_public/{gameId}` */
export interface GamePublicDoc {
  gameId?: number;
  gameTitle?: string;
  gameThumb?: string;
  ratingAvg?: number;
  ratingCount?: number;
  commentCount?: number;
  updatedAt?: any;
}

/** Documento de comentario en `games_public/{gameId}/comments/{commentId}` */
export interface GameCommentDoc {
  id?: string;
  gameId?: number;
  gameTitle?: string;
  gameThumb?: string;
  uid?: string;
  displayName?: string;
  photoURL?: string;
  text?: string;
  createdAt?: any;
  updatedAt?: any;
}

/** Documento de calificacion en `games_public/{gameId}/ratings/{uid}` */
export interface GameRatingDoc {
  /** Valor entre 1 y 5, validado tambien en las reglas de Firestore */
  value?: number;
  createdAt?: any;
  updatedAt?: any;
}
