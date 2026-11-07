
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionsBitField
} = require("discord.js");

require("dotenv").config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ===================================
// ROLE CONFIGURATION
// ===================================

const ROLES = {
    gamingCoding: {
        gaming: "PUT_GAMING_ROLE_ID",
        coding: "PUT_CODING_ROLE_ID"
    },

    gender: {
        male: "PUT_MALE_ROLE_ID",
        female: "PUT_FEMALE_ROLE_ID"
    },

    platform: {
        phone: "PUT_PHONE_ROLE_ID",
        pc: "PUT_PC_ROLE_ID"
    }
};

// ===================================
// SLASH COMMAND
// ===================================

const commands = [
    new SlashCommandBuilder()
        .setName("selrelos")
        .setDescription("Send the Spec Developr Roles Selection Panel")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

async function registerCommands() {
    await rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        { body: commands.map(command => command.toJSON()) }
    );

    console.log("Slash commands registered!");
}

// ===================================
// ROLES PANEL
// ===================================

function createPanel() {

    const embed = new EmbedBuilder()
        .setColor("#090909")
        .setTitle("Spec Developr — Roles Selection")
        .setDescription(
            "Choose your community roles below.\n\n" +

            "**Select Gaming to Coding**\n" +
            "Choose Gaming or Coding role.\n\n" +

            "**Select Gender**\n" +
            "Choose Male or Female role.\n\n" +

            "**Select Playing Platform**\n" +
            "Choose Phone or PC role."
        )
        .setFooter({
            text: "Spec Developr • Roles System"
        });

    const gamingMenu = new StringSelectMenuBuilder()
        .setCustomId("select_gaming_coding")
        .setPlaceholder("Select Gaming to Coding...")
        .addOptions(
            {
                label: "Gaming",
                value: "gaming",
                emoji: "🎮"
            },
            {
                label: "Coding",
                value: "coding",
                emoji: "💻"
            }
        );

    const genderMenu = new StringSelectMenuBuilder()
        .setCustomId("select_gender")
        .setPlaceholder("Select Gender...")
        .addOptions(
            {
                label: "Male",
                value: "male",
                emoji: "👨"
            },
            {
                label: "Female",
                value: "female",
                emoji: "👩"
            }
        );

    const platformMenu = new StringSelectMenuBuilder()
        .setCustomId("select_platform")
        .setPlaceholder("Select Platform...")
        .addOptions(
            {
                label: "Phone",
                value: "phone",
                emoji: "📱"
            },
            {
                label: "PC",
                value: "pc",
                emoji: "🖥️"
            }
        );

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(gamingMenu),
            new ActionRowBuilder().addComponents(genderMenu),
            new ActionRowBuilder().addComponents(platformMenu)
        ]
    };
}

// ===================================
// BOT READY
// ===================================

client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        await registerCommands();
    } catch (error) {
        console.error("Command registration error:", error);
    }
});

// ===================================
// INTERACTIONS
// ===================================

client.on("interactionCreate", async interaction => {

    // Slash command
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "selrelos") {

            if (!interaction.memberPermissions.has(
                PermissionsBitField.Flags.ManageRoles
            )) {
                return interaction.reply({
                    content: "❌ You need Manage Roles permission.",
                    ephemeral: true
                });
            }

            await interaction.channel.send(createPanel());

            return interaction.reply({
                content: "✅ Roles Selection Panel sent successfully!",
                ephemeral: true
            });
        }
    }

    // Select menus
    if (interaction.isStringSelectMenu()) {

        const member = await interaction.guild.members.fetch(
            interaction.user.id
        );

        let roleGroup;
        let selectedRole;

        if (interaction.customId === "select_gaming_coding") {
            roleGroup = Object.values(ROLES.gamingCoding);
            selectedRole = ROLES.gamingCoding[interaction.values[0]];
        }

        else if (interaction.customId === "select_gender") {
            roleGroup = Object.values(ROLES.gender);
            selectedRole = ROLES.gender[interaction.values[0]];
        }

        else if (interaction.customId === "select_platform") {
            roleGroup = Object.values(ROLES.platform);
            selectedRole = ROLES.platform[interaction.values[0]];
        }

        else {
            return;
        }

        if (!selectedRole || selectedRole.startsWith("PUT_")) {
            return interaction.reply({
                content: "❌ Role ID is not configured. Contact an administrator.",
                ephemeral: true
            });
        }

        const roles = roleGroup.filter(
            roleId => roleId && !roleId.startsWith("PUT_")
        );

        try {
            // Remove old roles from the same category
            const removeRoles = roles.filter(
                roleId => roleId !== selectedRole &&
                member.roles.cache.has(roleId)
            );

            if (removeRoles.length) {
                await member.roles.remove(removeRoles);
            }

            // Add selected role
            if (!member.roles.cache.has(selectedRole)) {
                await member.roles.add(selectedRole);
            }

            return interaction.reply({
                content: `✅ Successfully selected <@&${selectedRole}>!`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Role error:", error);

            return interaction.reply({
                content: "❌ I couldn't update your role. Check my permissions and role hierarchy.",
                ephemeral: true
            });
        }
    }
});

// ===================================
// LOGIN
// ===================================

client.login(process.env.BOT_TOKEN);
