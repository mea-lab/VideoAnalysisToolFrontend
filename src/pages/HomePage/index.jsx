import { React, useRef, useContext, useState } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import VisionMDLogo from "./logo.png";
import { useNavigate } from "react-router-dom";
import { VideoContext } from "../../contexts/VideoContext";

function HomePage() {
    const fileInputRef = useRef();
    const navigate = useNavigate();
    
    const {
        setVideoData,
    } = useContext(VideoContext);
    
    const triggerInputElement = () => {
        fileInputRef.current.click();
    };

    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setVideoData(file);
            navigate("/subjects");
        }
    };

    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                background: "linear-gradient(to right, #355994, #4b8d5b)",
                color: "white",
            }}
        > 
            <Typography variant="h3" component="h1" gutterBottom style={{ fontWeight: "bold" }}>
                VisionMD
            </Typography>

            <img
                src={VisionMDLogo}
                alt="VisionMD Logo"
                style={{ width: "150px", height: "auto", margin: "20px 0" }}
            />

            <Typography variant='h5' sx={{ paddingLeft: '15%', paddingRight: '15%' }}>
                A user-friendly, open-source software platform designed to automate video-based kinematic
                analysis of motor tasks for assessment of motor dysfunction in movement disorders.
            </Typography>

            <Box sx={{ display: "flex", gap: 2, marginTop: 4 }}>
                <Button
                    variant="outlined"
                    color="inherit"
                    size="large"
                    href="https://github.com/mea-lab/VideoAnalysisToolBackend"
                    sx={{ borderColor: "white", color: "white" }}
                >
                    View on GitHub
                </Button>
                <Button
                    variant="outlined"
                    color="inherit"
                    size="large"
                    href="https://www.dropbox.com/scl/fi/u43mwolb57ph6834v07d2/VisionMD_MacOS.zip"
                    sx={{ borderColor: "white", color: "white" }}
                >
                    Download (MacOS)
                </Button>
            </Box>

            <Box sx={{ marginTop: 6 }}>
                <input
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={handleVideoUpload}
                    style={{ display: "none" }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={triggerInputElement}
                    startIcon={<UploadIcon />}
                    sx={{ backgroundColor: "#ff5722" }}
                >
                    Upload Video for Analysis
                </Button>
            </Box>
        </Box>
    );
}

export default HomePage;
