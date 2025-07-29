namespace RPGSheetManager.Infra.Settings {
    public class MongoDbSettings {
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string CollectionName { get; set; } = string.Empty;
        public string UserCollectionName { get; set; } = string.Empty;
        public string CharacterCollectionName { get; set; } = string.Empty;
        public string CampaignCollectionName { get; set; } = string.Empty;
        public string SheetCollectionName { get; set; } = string.Empty;
    }
}
