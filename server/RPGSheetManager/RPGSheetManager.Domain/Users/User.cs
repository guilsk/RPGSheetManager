﻿using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Users {

    public class User {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public Guid Id { get; set; }
        public string AuthId { get; set; } = null!;
        public string DisplayName { get; set; } = null!;
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
